"""
Two-Factor Authentication Routes — TOTP-based 2FA with QR code setup
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from datetime import datetime
import pyotp
import qrcode
import io
import base64
import logging

from database.connection import db, get_user_by_email
from utils.security import require_auth
from utils.helpers import standard_response
from services.auth_service import create_access_token, serialize_user_data

router = APIRouter(prefix="/auth/2fa", tags=["Two-Factor Authentication"])
logger = logging.getLogger(__name__)

APP_NAME = "AI HealthCare"


@router.post("/setup")
async def setup_2fa(request: Request):
    email = await require_auth(request)

    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("totp_verified"):
        raise HTTPException(status_code=400, detail="2FA is already enabled")

    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=email, issuer_name=APP_NAME)

    # Generate QR code as base64 PNG
    qr = qrcode.QRCode(version=1, box_size=6, border=2)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()

    await db.store.update_one(
        {"email": email},
        {"$set": {"totp_secret": secret, "totp_verified": False}},
    )

    return standard_response(
        message="2FA setup initiated. Scan the QR code with your authenticator app.",
        data={
            "qr_code": f"data:image/png;base64,{qr_base64}",
            "secret": secret,
            "uri": provisioning_uri,
        },
    )


@router.post("/verify-setup")
async def verify_2fa_setup(request: Request):
    email = await require_auth(request)
    body = await request.json()
    code = body.get("code", "").strip()

    if not code or len(code) != 6:
        raise HTTPException(
            status_code=400, detail="Invalid code format. Must be 6 digits."
        )

    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    secret = user.get("totp_secret")
    if not secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")

    if user.get("totp_verified"):
        raise HTTPException(status_code=400, detail="2FA is already verified")

    totp = pyotp.TOTP(secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # Generate 8 recovery codes
    import secrets

    recovery_codes = [secrets.token_hex(4).upper() for _ in range(8)]

    await db.store.update_one(
        {"email": email},
        {
            "$set": {
                "totp_verified": True,
                "totp_enabled_at": datetime.utcnow(),
                "recovery_codes": recovery_codes,
            }
        },
    )

    logger.info(f"2FA enabled for {email}")

    return standard_response(
        message="2FA enabled successfully",
        data={"recovery_codes": recovery_codes},
    )


@router.post("/verify-login")
async def verify_2fa_login(request: Request):
    body = await request.json()
    email = body.get("email", "").strip()
    code = body.get("code", "").strip()
    is_recovery = body.get("is_recovery", False)

    if not email or not code:
        raise HTTPException(status_code=400, detail="Email and code are required")

    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.get("totp_verified"):
        raise HTTPException(
            status_code=400, detail="2FA is not enabled for this account"
        )

    verified = False

    if is_recovery:
        recovery_codes = user.get("recovery_codes", [])
        if code.upper() in recovery_codes:
            recovery_codes.remove(code.upper())
            await db.store.update_one(
                {"email": email},
                {"$set": {"recovery_codes": recovery_codes}},
            )
            verified = True
            logger.warning(
                f"Recovery code used for {email}. {len(recovery_codes)} codes remaining."
            )
    else:
        secret = user.get("totp_secret")
        if secret:
            totp = pyotp.TOTP(secret)
            verified = totp.verify(code, valid_window=1)

    if not verified:
        raise HTTPException(status_code=401, detail="Invalid verification code")

    token = create_access_token(email)
    import os

    response_data = standard_response(
        message="2FA verification successful",
        data={
            "user": serialize_user_data(user),
            "access_token": token,
            "token_type": "bearer",
        },
    )

    response = JSONResponse(content=jsonable_encoder(response_data))
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=os.environ.get("ENV", "development").lower() in ("production", "prod"),
        max_age=7 * 24 * 60 * 60,
        samesite="lax",
    )

    return response


@router.post("/disable")
async def disable_2fa(request: Request):
    email = await require_auth(request)
    body = await request.json()
    code = body.get("code", "").strip()

    if not code:
        raise HTTPException(
            status_code=400, detail="Verification code required to disable 2FA"
        )

    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.get("totp_verified"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")

    secret = user.get("totp_secret")
    totp = pyotp.TOTP(secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    await db.store.update_one(
        {"email": email},
        {
            "$unset": {
                "totp_secret": "",
                "totp_verified": "",
                "totp_enabled_at": "",
                "recovery_codes": "",
            }
        },
    )

    logger.info(f"2FA disabled for {email}")

    return standard_response(message="2FA has been disabled")


@router.get("/status")
async def get_2fa_status(request: Request):
    email = await require_auth(request)

    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return standard_response(
        message="2FA status",
        data={
            "enabled": bool(user.get("totp_verified")),
            "enabled_at": user.get("totp_enabled_at", "").isoformat()
            if isinstance(user.get("totp_enabled_at"), datetime)
            else str(user.get("totp_enabled_at", "")),
            "recovery_codes_remaining": len(user.get("recovery_codes", [])),
        },
    )
