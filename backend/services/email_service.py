"""
Email Service - Gmail SMTP Integration (async, non-blocking).
"""

import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import aiosmtplib

logger = logging.getLogger(__name__)

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_TIMEOUT_SECONDS = 30


def _get_credentials():
    from config.settings import SMTP_EMAIL, SMTP_PASSWORD, SMTP_FROM_NAME

    return SMTP_EMAIL, SMTP_PASSWORD, SMTP_FROM_NAME


async def send_email(to_email: str, subject: str, body: str, html: bool = True):
    """Send email via Gmail SMTP using aiosmtplib (non-blocking)."""
    smtp_email, smtp_password, from_name = _get_credentials()

    if not smtp_email or not smtp_password:
        logger.warning(
            "SMTP_EMAIL or SMTP_PASSWORD not set. Email skipped (safe for local dev)."
        )
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{from_name} <{smtp_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html" if html else "plain"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=smtp_email,
            password=smtp_password,
            timeout=SMTP_TIMEOUT_SECONDS,
        )
        logger.info(f"Email sent to {to_email}")
        return True
    except aiosmtplib.SMTPAuthenticationError:
        logger.error(
            "Gmail SMTP auth failed. Ensure you're using an App Password "
            "(not your regular password). Generate one at https://myaccount.google.com/apppasswords"
        )
        return False
    except aiosmtplib.SMTPException as e:
        logger.error(f"SMTP error sending email to {to_email}: {e}")
        return False
    except (TimeoutError, OSError) as e:
        logger.error(f"Network error sending email to {to_email}: {e}")
        return False


async def send_appointment_confirmation(email: str, appointment_data: dict):
    """Send appointment confirmation email"""
    subject = "Appointment Confirmation - AI Health Care"

    user_name = appointment_data.get("user_name", "Patient")
    doctor_name = appointment_data.get("doctor_name", "General Physician")
    doctor_spec = appointment_data.get("doctor_specialization", "Specialist")
    appt_date = appointment_data.get("date", "Upcoming")
    appt_time = appointment_data.get("time", "--:--")
    location = appointment_data.get("doctor_location", "Online / Clinic")

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #4f46e5;">Hello {user_name},</h2>

            <p>Your appointment has been <strong>confirmed</strong>!</p>

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
                <strong>Reminder:</strong> Please arrive 10 minutes before your scheduled time.
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
    subject = "Welcome to AI Health Care Platform"

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #4f46e5;">Welcome, {name}!</h2>

            <p>Thank you for registering with <strong>AI Health Care Platform</strong>.</p>

            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>What you can do now:</h3>
                <ul style="line-height: 2;">
                    <li>Check your symptoms with our AI-powered diagnosis</li>
                    <li>Book appointments with healthcare professionals</li>
                    <li>Chat with our health assistant</li>
                    <li>Track your health metrics</li>
                </ul>
            </div>

            <p style="background-color: #dbeafe; padding: 15px; border-radius: 5px; border-left: 4px solid #3b82f6;">
                <strong>Pro Tip:</strong> Complete your health profile for personalized recommendations!
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
    subject = "We received your message - AI Health Care"

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #4f46e5;">Hello {name},</h2>

            <p>Thank you for contacting us! We have received your message and will get back to you within <strong>24 hours</strong>.</p>

            <p style="background-color: #d1fae5; padding: 15px; border-radius: 5px; border-left: 4px solid #10b981;">
                Your message has been successfully submitted.
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
