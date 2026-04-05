"""
Authentication Routes
"""

from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder  # <--- ✅ IMPORT ADDED
from database.models import LoginRequest, SignupRequest
from services.auth_service import register_user, authenticate_user, get_current_user
from services.email_service import send_welcome_email
from database.connection import db
from utils.helpers import standard_response
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


# ==========================================
# AUTH STATUS ENDPOINT
# ==========================================
@router.get("/status")
async def check_auth_status(current_user: dict = Depends(get_current_user)):
    """
    Verifies the JWT token and restores session on page refresh.
    """
    return standard_response(
        message="User is authenticated", data={"user": current_user, "success": True}
    )


@router.post("/signup")
async def signup(user: SignupRequest, background_tasks: BackgroundTasks):
    """User registration with welcome email"""
    user_data = {
        "name": f"{user.first_name} {user.last_name}",
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "password": user.password,
        "gender": user.gender,
        "age": user.age,
        "phone": user.phone_number,
        "city": user.city,
        "state": user.state,
        "address": f"{user.city}, {user.state}",
        "height": "",
        "weight": "",
        "pressure": "",
        "bmi": "",
    }

    result = await register_user(user_data)

    if not result["success"]:
        raise HTTPException(status_code=409, detail=result["message"])

    # Send welcome email in background
    background_tasks.add_task(
        send_welcome_email, user.email, f"{user.first_name} {user.last_name}"
    )
    logger.info(f"📧 Welcome email queued for {user.email}")

    # Prepare response data
    response_data = standard_response(
        message=result["message"],
        data={
            "user": result["user"],
            "access_token": result["token"],
            "token_type": "bearer",
        },
    )

    # ✅ FIX: Use jsonable_encoder to safely convert dates/ObjectIds to strings
    response = JSONResponse(content=jsonable_encoder(response_data))

    # Keep cookie for additional security
    response.set_cookie(
        key="session_token",
        value=result["token"],
        httponly=True,
        secure=os.environ.get("ENV", "development").lower() in ("production", "prod"),
        max_age=7 * 24 * 60 * 60,
        samesite="lax",
    )

    return response


@router.post("/login")
async def login(credentials: LoginRequest):
    result = await authenticate_user(credentials.email, credentials.password)

    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["message"])

    user_doc = await db.store.find_one({"email": credentials.email})
    if user_doc and user_doc.get("totp_verified"):
        return JSONResponse(
            content=jsonable_encoder(
                standard_response(
                    message="2FA verification required",
                    data={"requires_2fa": True, "email": credentials.email},
                )
            )
        )

    # Prepare response data
    response_data = standard_response(
        message=result["message"],
        data={
            "user": result["user"],
            "access_token": result["token"],
            "token_type": "bearer",
        },
    )

    # ✅ FIX: Use jsonable_encoder to safely convert dates/ObjectIds to strings
    # This prevents "TypeError: Object of type datetime is not JSON serializable"
    response = JSONResponse(content=jsonable_encoder(response_data))

    # Keep cookie for additional security
    response.set_cookie(
        key="session_token",
        value=result["token"],
        httponly=True,
        secure=os.environ.get("ENV", "development").lower() in ("production", "prod"),
        max_age=7 * 24 * 60 * 60,
        samesite="lax",
    )

    return response


@router.post("/logout")
async def logout(request: Request):
    """User logout"""
    token = request.cookies.get("session_token")

    response = JSONResponse(
        content=standard_response(message="Logged out successfully")
    )
    response.delete_cookie("session_token")
    return response
