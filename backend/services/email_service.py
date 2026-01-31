"""
Email Service - Mailtrap Integration
File Path: services/email_service.py
"""
import os
import asyncio
import logging
from mailtrap import MailtrapClient, Mail, Address

logger = logging.getLogger(__name__)

# Mailtrap Configuration
MAILTRAP_TOKEN = os.getenv("MAILTRAP_API_TOKEN")
FROM_EMAIL = os.getenv("MAILTRAP_FROM_EMAIL", "no-reply@demomailtrap.co")
FROM_NAME = os.getenv("MAILTRAP_FROM_NAME", "AI Health Platform")

# Initialize client once
client = MailtrapClient(token=MAILTRAP_TOKEN) if MAILTRAP_TOKEN else None


async def send_email(to_email: str, subject: str, body: str, html: bool = True):
    """Send email using Mailtrap SDK"""
    if not client:
        # Prevent crash in local development if token is missing
        logger.warning("⚠️ Mailtrap token missing. Email skipped (Safe for local dev)")
        return False
    
    try:
        mail = Mail(
            sender=Address(email=FROM_EMAIL, name=FROM_NAME),
            to=[Address(email=to_email)],
            subject=subject,
            html=body if html else f"<pre>{body}</pre>",
            text=body if not html else None,
        )
        
        # Run synchronous Mailtrap send in thread pool to avoid blocking FastAPI
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, client.send, mail)
        
        logger.info(f"✅ Email sent to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Email send failed: {e}")
        return False


async def send_appointment_confirmation(email: str, appointment_data: dict):
    """Send appointment confirmation email"""
    subject = "🩺 Appointment Confirmation - AI Health Care"
    
    # ✅ FIX: Use .get() and snake_case to match Database Schema
    user_name = appointment_data.get('user_name', 'Patient')
    doctor_name = appointment_data.get('doctor_name', 'General Physician')
    doctor_spec = appointment_data.get('doctor_specialization', 'Specialist')
    appt_date = appointment_data.get('date', 'Upcoming')
    appt_time = appointment_data.get('time', '--:--')
    location = appointment_data.get('doctor_location', 'Online / Clinic')

    # HTML email body
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #4f46e5;">Hello {user_name},</h2>
            
            <p>Your appointment has been <strong>confirmed</strong>! ✅</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Appointment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Doctor:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{doctor_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Specialization:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{doctor_spec}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{appt_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Time:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{appt_time}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0;"><strong>Location:</strong></td>
                        <td style="padding: 10px 0;">{location}</td>
                    </tr>
                </table>
            </div>
            
            <p style="background-color: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b;">
                ⏰ <strong>Reminder:</strong> Please arrive 10 minutes before your scheduled time.
            </p>
            
            <p>Thank you for choosing AI Health Care Platform.</p>
            
            <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>AI Health Care Team</strong>
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </body>
    </html>
    """
    
    return await send_email(email, subject, body, html=True)


async def send_welcome_email(email: str, name: str):
    """Send welcome email to new users"""
    subject = "🎉 Welcome to AI Health Care Platform"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #4f46e5;">Welcome, {name}! 👋</h2>
            
            <p>Thank you for registering with <strong>AI Health Care Platform</strong>.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>What you can do now:</h3>
                <ul style="line-height: 2;">
                    <li>🩺 Check your symptoms with our AI-powered diagnosis</li>
                    <li>📅 Book appointments with healthcare professionals</li>
                    <li>💬 Chat with our health assistant</li>
                    <li>📊 Track your health metrics</li>
                </ul>
            </div>
            
            <p style="background-color: #dbeafe; padding: 15px; border-radius: 5px; border-left: 4px solid #3b82f6;">
                💡 <strong>Pro Tip:</strong> Complete your health profile for personalized recommendations!
            </p>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>AI Health Care Team</strong>
            </p>
        </div>
    </body>
    </html>
    """
    
    return await send_email(email, subject, body, html=True)


async def send_contact_confirmation(email: str, name: str):
    """Send contact form confirmation email"""
    subject = "✅ We received your message - AI Health Care"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #4f46e5;">Hello {name},</h2>
            
            <p>Thank you for contacting us! We have received your message and will get back to you within <strong>24 hours</strong>.</p>
            
            <p style="background-color: #d1fae5; padding: 15px; border-radius: 5px; border-left: 4px solid #10b981;">
                ✅ Your message has been successfully submitted.
            </p>
            
            <p>Our support team is reviewing your inquiry and will respond as soon as possible.</p>
            
            <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>AI Health Care Support Team</strong>
            </p>
        </div>
    </body>
    </html>
    """
    
    return await send_email(email, subject, body, html=True)
