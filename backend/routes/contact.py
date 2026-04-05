"""
Contact Form Routes
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from database.models import ContactRequest
from database.connection import db
from utils.helpers import standard_response
from utils.security import require_auth
from services.email_service import send_email, send_contact_confirmation
from config.settings import ADMIN_EMAIL
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import logging


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/contact", tags=["Contact"])


@router.post("")
async def submit_contact(contact: ContactRequest, background_tasks: BackgroundTasks):
    """Submit contact form with email notifications"""
    try:
        # Save to database
        contact_data = contact.dict()
        contact_data["submitted_at"] = datetime.utcnow()
        contact_data["status"] = "new"

        result = await db.contacts.insert_one(contact_data)
        contact_id = str(result.inserted_id)

        # Send email to admin (in background)
        background_tasks.add_task(
            send_admin_notification,
            contact.name,
            contact.email,
            contact.phone,
            contact.details,
            contact_id,
        )

        # Send confirmation to user (in background)
        background_tasks.add_task(
            send_contact_confirmation, contact.email, contact.name
        )

        logger.info(f"📧 Contact emails queued for {contact.email}")

        return standard_response(
            message="Thank you for contacting us! We've received your message and will respond within 24 hours.",
            data={"contact_id": contact_id, "status": "submitted"},
        )

    except Exception as e:
        logger.error(f"Submit contact error: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit contact form")


async def send_admin_notification(
    name: str, email: str, phone: str, details: str, contact_id: str
):
    """Send notification email to admin about new contact form submission"""
    subject = f"🔔 New Contact Form Submission - {name}"

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #4f46e5;">📬 New Contact Form Submission</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                            <a href="mailto:{email}" style="color: #4f46e5;">{email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{phone or "Not provided"}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Contact ID:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><code>{contact_id}</code></td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Submitted:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{datetime.utcnow().strftime("%B %d, %Y at %I:%M %p UTC")}</td>
                    </tr>
                </table>
            </div>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h3 style="margin-top: 0; color: #92400e;">📝 Message:</h3>
                <p style="white-space: pre-wrap; color: #451a03;">{details}</p>
            </div>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; border-left: 4px solid #3b82f6; margin-top: 20px;">
                <p style="margin: 0;">
                    ⚡ <strong>Action Required:</strong> Please respond to this inquiry within 24 hours.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:{email}?subject=Re: Your inquiry to AI Health Care" 
                   style="background-color: #4f46e5; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    📧 Reply to {name}
                </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 12px; color: #888;">
                This is an automated notification from AI Health Care Platform.
            </p>
        </div>
    </body>
    </html>
    """

    await send_email(ADMIN_EMAIL, subject, body, html=True)


@router.get("/submissions")
async def get_contact_submissions(request: Request):
    """Get all contact form submissions (admin only)"""
    email = await require_auth(request)
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")
    try:
        # Get all submissions, sorted by newest first
        cursor = db.contacts.find().sort("submitted_at", -1).limit(100)
        submissions = await cursor.to_list(length=100)

        # Convert ObjectId to string
        for submission in submissions:
            submission["_id"] = str(submission["_id"])

        return standard_response(
            message="Contact submissions retrieved successfully",
            data={"submissions": submissions, "count": len(submissions)},
        )

    except Exception as e:
        logger.error(f"Get submissions error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get submissions")


@router.patch("/submissions/{contact_id}/status")
async def update_submission_status(request: Request, contact_id: str, status: str):
    """Update contact submission status (admin only)"""
    email = await require_auth(request)
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")
    try:
        valid_statuses = ["new", "in_progress", "resolved", "closed"]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {valid_statuses}",
            )

        try:
            oid = ObjectId(contact_id)
        except (InvalidId, Exception):
            raise HTTPException(status_code=400, detail="Invalid contact ID format")

        result = await db.contacts.update_one(
            {"_id": oid},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}},
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Contact submission not found")

        return standard_response(message=f"Status updated to '{status}' successfully")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update status")
