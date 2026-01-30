"""
Appointments Routes
"""
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from database.models import AppointmentRequest, StandardResponse
from database.connection import db
from utils.security import require_auth, get_current_user
from utils.helpers import standard_response
from services.email_service import send_appointment_confirmation, send_email
from datetime import datetime
import logging


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("/book")
async def book_appointment(
    request: Request, 
    appointment: AppointmentRequest,
    background_tasks: BackgroundTasks
):
    """Book a new appointment with email confirmation"""
    try:
        email = await require_auth(request)
        
        # Create appointment document
        appointment_data = appointment.dict()
        appointment_data["user_email"] = email
        appointment_data["status"] = "pending"
        appointment_data["created_at"] = datetime.utcnow()
        
        # Insert into database
        result = await db.appointments.insert_one(appointment_data)
        appointment_id = str(result.inserted_id)
        
        # Send confirmation email in background (non-blocking)
        background_tasks.add_task(
            send_appointment_confirmation,
            email,
            appointment_data
        )
        logger.info(f"📧 Appointment confirmation queued for {email}")
        
        return standard_response(
            message="Appointment booked successfully! Confirmation email sent.",
            data={
                "appointment_id": appointment_id,
                "status": "pending",
                "date": appointment.date,
                "time": appointment.time,
                "doctor": appointment.doctor_name,
                "location": appointment.doctor_location
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Book appointment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to book appointment")


@router.get("")
async def get_appointments(request: Request):
    """Get user's appointments"""
    try:
        email = await require_auth(request)
        
        # Get all appointments for user
        cursor = db.appointments.find({"user_email": email}).sort("created_at", -1)
        appointments = await cursor.to_list(length=100)
        
        # Convert ObjectId to string
        for apt in appointments:
            apt["_id"] = str(apt["_id"])
        
        return standard_response(
            message="Appointments retrieved successfully",
            data={
                "appointments": appointments,
                "count": len(appointments)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get appointments error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get appointments")


@router.delete("/{appointment_id}")
async def cancel_appointment(
    request: Request, 
    appointment_id: str,
    background_tasks: BackgroundTasks
):
    """Cancel an appointment with email notification"""
    try:
        email = await require_auth(request)
        
        from bson import ObjectId
        
        # Find appointment first (to get details for email)
        appointment = await db.appointments.find_one({
            "_id": ObjectId(appointment_id),
            "user_email": email
        })
        
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Delete appointment
        result = await db.appointments.delete_one({
            "_id": ObjectId(appointment_id),
            "user_email": email
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Send cancellation email in background
        background_tasks.add_task(
            send_appointment_cancellation,
            email,
            appointment
        )
        logger.info(f"📧 Cancellation email queued for {email}")
        
        return standard_response(
            message="Appointment cancelled successfully. Confirmation email sent."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cancel appointment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel appointment")


async def send_appointment_cancellation(email: str, appointment_data: dict):
    """Send appointment cancellation email"""
    subject = "❌ Appointment Cancelled - AI Health Care"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #dc2626;">Appointment Cancelled</h2>
            
            <p>Hello {appointment_data.get('name', 'there')},</p>
            
            <p>Your appointment has been <strong>cancelled</strong> as per your request.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Cancelled Appointment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Doctor:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{appointment_data.get('doctor_name', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{appointment_data.get('date', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Time:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{appointment_data.get('time', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0;"><strong>Location:</strong></td>
                        <td style="padding: 10px 0;">{appointment_data.get('doctor_location', 'N/A')}</td>
                    </tr>
                </table>
            </div>
            
            <p style="background-color: #fee2e2; padding: 15px; border-radius: 5px; border-left: 4px solid #dc2626;">
                ❌ This appointment has been cancelled and removed from our system.
            </p>
            
            <p>If you'd like to reschedule or book a new appointment, please visit our platform.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/appointments" 
                   style="background-color: #4f46e5; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Book New Appointment
                </a>
            </div>
            
            <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>AI Health Care Team</strong>
            </p>
        </div>
    </body>
    </html>
    """
    
    await send_email(email, subject, body, html=True)
