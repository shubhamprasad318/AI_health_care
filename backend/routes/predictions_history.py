"""
Prediction History Routes
"""
from fastapi import APIRouter, HTTPException, Request, Query
from database.connection import db
from utils.security import require_auth
from utils.helpers import standard_response
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predictions", tags=["Predictions History"])


@router.get("/history")
async def get_prediction_history(
    request: Request,
    limit: int = Query(50, ge=1, le=100)
):
    """Get user's prediction history"""
    try:
        email = await require_auth(request)
        
        # Get predictions
        cursor = db.predictions.find({"email": email}).sort("created_at", -1).limit(limit)
        predictions = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for pred in predictions:
            pred["_id"] = str(pred["_id"])
            # Format datetime
            if "created_at" in pred:
                pred["created_at"] = pred["created_at"].isoformat()
        
        return standard_response(
            message="Prediction history retrieved successfully",
            data={
                "predictions": predictions,
                "count": len(predictions)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get history error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get prediction history")


@router.get("/statistics")
async def get_prediction_statistics(request: Request):
    """Get user's prediction statistics"""
    try:
        email = await require_auth(request)
        
        # Get total predictions
        total = await db.predictions.count_documents({"email": email})
        
        # Get predictions in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent = await db.predictions.count_documents({
            "email": email,
            "created_at": {"$gte": thirty_days_ago}
        })
        
        # Get most common predictions
        pipeline = [
            {"$match": {"email": email}},
            {"$group": {"_id": "$ml_prediction", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        
        common_predictions = []
        async for doc in db.predictions.aggregate(pipeline):
            common_predictions.append({
                "disease": doc["_id"],
                "count": doc["count"]
            })
        
        return standard_response(
            message="Statistics retrieved successfully",
            data={
                "total_predictions": total,
                "recent_predictions": recent,
                "most_common": common_predictions
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get statistics error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")
