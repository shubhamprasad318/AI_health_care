"""
Health Dashboard Routes
"""
from fastapi import APIRouter, HTTPException, Request
from database.connection import db
from utils.security import require_auth
from utils.helpers import standard_response
from datetime import datetime, timedelta
import logging


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["Dashboard"])


@router.get("/dashboard")
async def get_dashboard(request: Request):
    """Get comprehensive health dashboard data"""
    try:
        email = await require_auth(request)
        
        # Get user data
        user = await db.store.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get recent predictions (last 5)
        predictions_cursor = db.predictions.find({"email": email}).sort("created_at", -1).limit(5)
        recent_predictions = await predictions_cursor.to_list(length=5)
        
        for pred in recent_predictions:
            pred["_id"] = str(pred["_id"])
            if isinstance(pred.get("created_at"), datetime):
                pred["created_at"] = pred["created_at"].isoformat()
        
        # Get upcoming appointments (only future appointments)
        today = datetime.utcnow().strftime("%Y-%m-%d")
        appointments_cursor = db.appointments.find({
            "user_email": email,
            "date": {"$gte": today}
        }).sort("date", 1).limit(5)
        upcoming_appointments = await appointments_cursor.to_list(length=5)
        
        for apt in upcoming_appointments:
            apt["_id"] = str(apt["_id"])
        
        # Get statistics
        total_predictions = await db.predictions.count_documents({"email": email})
        total_appointments = await db.appointments.count_documents({"user_email": email})
        
        # Get most common health issue
        pipeline = [
            {"$match": {"email": email}},
            {"$group": {"_id": "$ml_prediction", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        common_issues = await db.predictions.aggregate(pipeline).to_list(1)
        most_common_issue = common_issues[0]["_id"] if common_issues else None
        
        # Health metrics
        health_metrics = {
            "height": user.get("height") or "Not set",
            "weight": user.get("weight") or "Not set",
            "bmi": user.get("bmi") or "Not set",
            "blood_pressure": user.get("pressure") or "Not set"
        }
        
        # Calculate health score (0-100)
        health_score = calculate_health_score(user, total_predictions, total_appointments)
        
        # Get health status
        health_status = get_health_status(health_score)
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_predictions_count = await db.predictions.count_documents({
            "email": email,
            "created_at": {"$gte": thirty_days_ago}
        })
        recent_appointments_count = await db.appointments.count_documents({
            "user_email": email,
            "created_at": {"$gte": thirty_days_ago}
        })
        
        return standard_response(
            message="Dashboard data retrieved successfully",
            data={
                "user_profile": {
                    "name": user.get("name", "User"),
                    "email": email,
                    "age": user.get("age"),
                    "gender": user.get("gender"),
                    "city": user.get("city"),
                    "state": user.get("state"),
                    "phone": user.get("phone")
                },
                "health_metrics": health_metrics,
                "health_score": {
                    "score": health_score,
                    "status": health_status["status"],
                    "message": health_status["message"],
                    "color": health_status["color"]
                },
                "recent_predictions": recent_predictions,
                "upcoming_appointments": upcoming_appointments,
                "statistics": {
                    "total_predictions": total_predictions,
                    "total_appointments": total_appointments,
                    "most_common_issue": most_common_issue,
                    "predictions_last_30_days": recent_predictions_count,
                    "appointments_last_30_days": recent_appointments_count
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get dashboard error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard data")


@router.get("/metrics")
async def get_health_metrics(request: Request):
    """Get user's health metrics only"""
    try:
        email = await require_auth(request)
        
        user = await db.store.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        metrics = {
            "height": user.get("height") or "",
            "weight": user.get("weight") or "",
            "bmi": user.get("bmi") or "",
            "blood_pressure": user.get("pressure") or ""
        }
        
        # Calculate BMI category if available
        bmi_category = None
        if metrics["bmi"]:
            try:
                bmi_value = float(metrics["bmi"])
                bmi_category = get_bmi_category(bmi_value)
            except ValueError:
                pass
        
        # Analyze blood pressure if available
        bp_status = None
        if metrics["blood_pressure"]:
            bp_status = analyze_blood_pressure(metrics["blood_pressure"])
        
        return standard_response(
            message="Health metrics retrieved successfully",
            data={
                "metrics": metrics,
                "bmi_category": bmi_category,
                "blood_pressure_status": bp_status
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get metrics error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get health metrics")


def calculate_health_score(user: dict, total_predictions: int, total_appointments: int) -> int:
    """Calculate health score based on various factors (0-100)"""
    score = 50  # Base score
    
    # Profile completeness (up to +20)
    completeness = 0
    required_fields = ["height", "weight", "age", "gender", "phone"]
    for field in required_fields:
        if user.get(field):
            completeness += 4
    score += completeness
    
    # BMI factor (up to +15)
    bmi = user.get("bmi")
    if bmi:
        try:
            bmi_value = float(bmi)
            if 18.5 <= bmi_value <= 24.9:
                score += 15  # Healthy BMI
            elif 25 <= bmi_value <= 29.9:
                score += 10  # Slightly overweight
            elif 17 <= bmi_value < 18.5 or 30 <= bmi_value <= 34.9:
                score += 5   # Underweight or obese
            # Severe cases: no bonus
        except ValueError:
            pass
    
    # Blood pressure factor (up to +10)
    pressure = user.get("pressure")
    if pressure:
        bp_status = analyze_blood_pressure(pressure)
        if bp_status and bp_status["category"] == "Normal":
            score += 10
        elif bp_status and bp_status["category"] == "Elevated":
            score += 5
    
    # Activity bonus (up to +5)
    if total_predictions > 0:
        score += min(total_predictions, 3)  # Max +3
    if total_appointments > 0:
        score += min(total_appointments, 2)  # Max +2
    
    # Ensure score is within 0-100
    return min(max(score, 0), 100)


def get_health_status(score: int) -> dict:
    """Get health status based on score"""
    if score >= 85:
        return {
            "status": "Excellent",
            "message": "Your health profile is excellent! Keep up the great work!",
            "color": "#10b981"  # Green
        }
    elif score >= 70:
        return {
            "status": "Good",
            "message": "You're doing well! Consider completing your health profile.",
            "color": "#3b82f6"  # Blue
        }
    elif score >= 50:
        return {
            "status": "Fair",
            "message": "There's room for improvement. Update your health metrics.",
            "color": "#f59e0b"  # Orange
        }
    else:
        return {
            "status": "Needs Attention",
            "message": "Please complete your health profile and consult a doctor.",
            "color": "#ef4444"  # Red
        }


def get_bmi_category(bmi: float) -> dict:
    """Get BMI category and recommendation"""
    if bmi < 16:
        return {
            "category": "Severely Underweight",
            "message": "Please consult a healthcare professional",
            "color": "#dc2626"
        }
    elif bmi < 18.5:
        return {
            "category": "Underweight",
            "message": "Consider gaining weight through healthy diet",
            "color": "#f59e0b"
        }
    elif bmi < 25:
        return {
            "category": "Normal",
            "message": "Your BMI is in the healthy range!",
            "color": "#10b981"
        }
    elif bmi < 30:
        return {
            "category": "Overweight",
            "message": "Consider exercise and healthy eating",
            "color": "#f59e0b"
        }
    elif bmi < 35:
        return {
            "category": "Obese Class I",
            "message": "Please consult a healthcare professional",
            "color": "#ef4444"
        }
    elif bmi < 40:
        return {
            "category": "Obese Class II",
            "message": "Medical consultation strongly recommended",
            "color": "#dc2626"
        }
    else:
        return {
            "category": "Obese Class III",
            "message": "Urgent medical consultation required",
            "color": "#991b1b"
        }


def analyze_blood_pressure(bp: str) -> dict:
    """Analyze blood pressure and categorize"""
    try:
        parts = bp.split("/")
        if len(parts) != 2:
            return None
        
        systolic = int(parts[0].strip())
        diastolic = int(parts[1].strip())
        
        if systolic < 120 and diastolic < 80:
            return {
                "category": "Normal",
                "message": "Your blood pressure is normal",
                "color": "#10b981"
            }
        elif systolic < 130 and diastolic < 80:
            return {
                "category": "Elevated",
                "message": "Watch your blood pressure",
                "color": "#f59e0b"
            }
        elif systolic < 140 or diastolic < 90:
            return {
                "category": "High Blood Pressure (Stage 1)",
                "message": "Consult your doctor",
                "color": "#ef4444"
            }
        elif systolic < 180 or diastolic < 120:
            return {
                "category": "High Blood Pressure (Stage 2)",
                "message": "Medical attention needed",
                "color": "#dc2626"
            }
        else:
            return {
                "category": "Hypertensive Crisis",
                "message": "Seek emergency medical care",
                "color": "#991b1b"
            }
    except Exception:
        return None
