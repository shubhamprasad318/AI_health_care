"""
Real-time Notifications via WebSocket
Routes: /ws/notifications (WebSocket), /notifications/* (REST)
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, HTTPException
from jose import jwt, JWTError
from config.settings import SECRET_KEY
from database.connection import db
from utils.security import require_auth
from utils.helpers import standard_response, serialize_mongo_doc
from datetime import datetime
import logging
import json
from typing import Dict, List, Optional
from bson import ObjectId

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Notifications"])


# ── In-memory WebSocket connection manager ──
class ConnectionManager:
    """Manages active WebSocket connections per user"""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, email: str):
        await websocket.accept()
        if email not in self.active_connections:
            self.active_connections[email] = []
        self.active_connections[email].append(websocket)
        logger.info(
            f"WebSocket connected: {email} (total: {len(self.active_connections[email])})"
        )

    def disconnect(self, websocket: WebSocket, email: str):
        if email in self.active_connections:
            self.active_connections[email] = [
                ws for ws in self.active_connections[email] if ws != websocket
            ]
            if not self.active_connections[email]:
                del self.active_connections[email]
        logger.info(f"WebSocket disconnected: {email}")

    async def send_to_user(self, email: str, message: dict):
        """Send notification to all connections of a user"""
        if email in self.active_connections:
            dead = []
            for ws in self.active_connections[email]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.active_connections[email] = [
                    w for w in self.active_connections[email] if w != ws
                ]

    def is_online(self, email: str) -> bool:
        return (
            email in self.active_connections and len(self.active_connections[email]) > 0
        )


manager = ConnectionManager()


# ── WebSocket Endpoint ──
@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    """WebSocket endpoint for real-time notifications"""
    email = None
    try:
        # Authenticate via cookie
        cookies = websocket.cookies
        token = cookies.get("session_token")

        if not token:
            # Try query param as fallback (for clients that can't send cookies on WS)
            token = websocket.query_params.get("token")

        if not token:
            await websocket.close(code=4001, reason="Authentication required")
            return

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            email = payload.get("sub")
            if not email:
                await websocket.close(code=4001, reason="Invalid token")
                return
        except JWTError:
            await websocket.close(code=4001, reason="Invalid token")
            return

        await manager.connect(websocket, email)

        unread_count = await db.notifications.count_documents(
            {"email": email, "read": False}
        )
        await websocket.send_json(
            {
                "type": "connected",
                "unread_count": unread_count,
            }
        )

        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "mark_read" and msg.get("id"):
                    await db.notifications.update_one(
                        {"_id": ObjectId(msg["id"]), "email": email},
                        {"$set": {"read": True}},
                    )
                    unread = await db.notifications.count_documents(
                        {"email": email, "read": False}
                    )
                    await websocket.send_json(
                        {
                            "type": "unread_update",
                            "unread_count": unread,
                        }
                    )
                elif msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        if email:
            manager.disconnect(websocket, email)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if email:
            manager.disconnect(websocket, email)


# ── Helper: Create & push notification ──
async def notify_user(
    email: str,
    title: str,
    message: str,
    ntype: str = "info",
    link: Optional[str] = None,
):
    """
    Create a notification and push it via WebSocket if user is online.
    ntype: info, success, warning, error, appointment, prediction, medication
    """
    notification = {
        "email": email,
        "title": title,
        "message": message,
        "type": ntype,
        "link": link,
        "read": False,
        "created_at": datetime.utcnow().isoformat(),
    }

    result = await db.notifications.insert_one(notification)
    notification["_id"] = str(result.inserted_id)

    # Push via WebSocket if online
    ws_message = {
        "type": "notification",
        "notification": notification,
    }
    await manager.send_to_user(email, ws_message)

    return notification


# ── REST Endpoints ──
@router.get("/notifications", tags=["Notifications"])
async def get_notifications(
    request: Request, limit: int = 50, unread_only: bool = False
):
    """Get user's notifications"""
    try:
        email = await require_auth(request)
        query = {"email": email}
        if unread_only:
            query["read"] = False

        cursor = (
            db.notifications.find(query).sort("created_at", -1).limit(min(limit, 200))
        )
        notifications = []
        async for doc in cursor:
            notifications.append(serialize_mongo_doc(doc))

        unread_count = await db.notifications.count_documents(
            {"email": email, "read": False}
        )

        return standard_response(
            message=f"Found {len(notifications)} notifications",
            data={
                "notifications": notifications,
                "unread_count": unread_count,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get notifications error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")


@router.patch("/notifications/{notification_id}/read", tags=["Notifications"])
async def mark_notification_read(request: Request, notification_id: str):
    """Mark a notification as read"""
    try:
        email = await require_auth(request)
        result = await db.notifications.update_one(
            {"_id": ObjectId(notification_id), "email": email},
            {"$set": {"read": True}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")

        return standard_response(message="Notification marked as read")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mark read error: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark notification")


@router.patch("/notifications/read-all", tags=["Notifications"])
async def mark_all_read(request: Request):
    """Mark all notifications as read"""
    try:
        email = await require_auth(request)
        result = await db.notifications.update_many(
            {"email": email, "read": False},
            {"$set": {"read": True}},
        )
        return standard_response(
            message=f"Marked {result.modified_count} notifications as read",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mark all read error: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark notifications")


@router.delete("/notifications/{notification_id}", tags=["Notifications"])
async def delete_notification(request: Request, notification_id: str):
    """Delete a notification"""
    try:
        email = await require_auth(request)
        result = await db.notifications.delete_one(
            {"_id": ObjectId(notification_id), "email": email}
        )
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")

        return standard_response(message="Notification deleted")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete notification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete notification")
