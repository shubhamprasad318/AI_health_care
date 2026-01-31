"""
Appointments Routes
File Path: routes/appointments.py
"""
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, Depends
from database.models import AppointmentRequest
from database.connection import db
# ✅ FIX: Use the new Auth system
from services.auth_service import get_current_user
from utils.helpers import standard_response
# ✅ FIX: Import email service safely
from services.email_service import send_appointment_confirmation, send_email
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("/book")
async def book_appointment(
    appointment: AppointmentRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)  # ✅ FIX: New Auth
):
    """Book a new appointment with email confirmation"""
    try:
        # ✅ CRITICAL FIX: Safely get doctor name to prevent 500 Crash
        # If missing, it defaults to "General Physician"
        doctor_name = getattr(appointment, "doctor_name", "General Physician")
        doctor_location = getattr(appointment, "doctor_location", "Online/Clinic")

        # Prepare data
        appointment_data = appointment.dict()
        appointment_data["user_email"] = current_user["email"]
        appointment_data["user_name"] = current_user.get("name", "Patient")
        appointment_data["doctor_name"] = doctor_name 
        appointment_data["doctor_location"] = doctor_location
        appointment_data["status"] = "pending"
        appointment_data["created_at"] = datetime.utcnow()
        
        # ✅ FIX: Correct Database Access
        # We access the 'appointments' collection directly from the DB connection
        result = await db.store.db["appointments"].insert_one(appointment_data)
        appointment_id = str(result.inserted_id)
        
        # ✅ FIX: Safe Email Sending (Wrapped in try/except)
        try:
            background_tasks.add_task(
                send_appointment_confirmation,
                current_user["email"],
                appointment_data
            )
            logger.info(f"📧 Appointment confirmation queued for {current_user['email']}")
        except Exception as e:
            logger.warning(f"Email failed to queue (ignoring to keep booking valid): {e}")
        
        return standard_response(
            message="Appointment booked successfully!",
            data={
                "appointment_id": appointment_id,
                "status": "pending",
                "date": appointment.date,
                "time": appointment.time,
                "doctor": doctor_name,
                "location": doctor_location
            }
        )
        
    except Exception as e:
        logger.error(f"Book appointment error: {e}")
        # Return a clean error instead of crashing
        raise HTTPException(status_code=500, detail="Failed to book appointment")


@router.get("")
async def get_appointments(current_user: dict = Depends(get_current_user)):
    """Get user's appointments"""
    try:
        # ✅ FIX: Correct DB Query
        cursor = db.store.db["appointments"].find({"user_email": current_user["email"]}).sort("created_at", -1)
        appointments = await cursor.to_list(length=100)
        
        # Convert ObjectId to string for Frontend
        for apt in appointments:
            apt["_id"] = str(apt["_id"])
            # Fix dates if they exist
            if "created_at" in apt and isinstance(apt["created_at"], datetime):
                apt["created_at"] = apt["created_at"].isoformat()
        
        return standard_response(
            message="Appointments retrieved successfully",
            data={
                "appointments": appointments,
                "count": len(appointments)
            }
        )
        
    except Exception as e:
        logger.error(f"Get appointments error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get appointments")


@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Cancel an appointment"""
    try:
        from bson import ObjectId
        
        query = {
            "_id": ObjectId(appointment_id),
            "user_email": current_user["email"]
        }
        
        # Find and delete
        appointment = await db.store.db["appointments"].find_one_and_delete(query)
        
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Send cancellation email (using internal function below)
        try:
            background_tasks.add_task(
                send_appointment_cancellation,
                current_user["email"],
                appointment
            )
            logger.info(f"📧 Cancellation email queued for {current_user['email']}")
        except Exception:
            pass # Ignore email errors on cancel
        
        return standard_response(
            message="Appointment cancelled successfully."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cancel appointment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel appointment")

# Internal helper for cancellation emails
async def send_appointment_cancellation(email: str, appointment_data: dict):
    """Send appointment cancellation email"""
    subject = "❌ Appointment Cancelled - AI Health Care"
    
    # Safe .get() calls to prevent crashes
    doctor = appointment_data.get('doctor_name', 'N/A')
    date = appointment_data.get('date', 'N/A')
    time = appointment_data.get('time', 'N/A')
    location = appointment_data.get('doctor_location', 'N/A')
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #dc2626;">Appointment Cancelled</h2>
            <p>Your appointment has been <strong>cancelled</strong> as per your request.</p>
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Cancelled Appointment Details</h3>
                <p><strong>Doctor:</strong> {doctor}</p>
                <p><strong>Date:</strong> {date} at {time}</p>
                <p><strong>Location:</strong> {location}</p>
            </div>
            <p>Best regards,<br><strong>AI Health Care Team</strong></p>
        </div>
    </body>
    </html>
    """
    
    await send_email(email, subject, body, html=True)
