"""
Authentication Routes
"""
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from database.models import LoginRequest, SignupRequest
from services.auth_service import register_user, authenticate_user
from services.email_service import send_welcome_email
from database.connection import delete_session
from utils.helpers import standard_response
import logging


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


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
        "bmi": ""
    }
    
    result = await register_user(user_data)
    
    if not result["success"]:
        raise HTTPException(status_code=409, detail=result["message"])
    
    # Send welcome email in background (non-blocking)
    background_tasks.add_task(
        send_welcome_email,
        user.email,
        f"{user.first_name} {user.last_name}"
    )
    logger.info(f"📧 Welcome email queued for {user.email}")
    
    response = JSONResponse(
        content=standard_response(
            message=result["message"],
            data=result["user"]
        )
    )
    response.set_cookie(
        key="session_token",
        value=result["token"],
        httponly=True,
        max_age=7*24*60*60,
        samesite="lax"
    )
    
    return response


@router.post("/login")
async def login(credentials: LoginRequest):
    """User login"""
    result = await authenticate_user(credentials.email, credentials.password)
    
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["message"])
    
    response = JSONResponse(
        content=standard_response(
            message=result["message"],
            data=result["user"]
        )
    )
    response.set_cookie(
        key="session_token",
        value=result["token"],
        httponly=True,
        max_age=7*24*60*60,
        samesite="lax"
    )
    
    return response


@router.post("/logout")
async def logout(request: Request):
    """User logout"""
    token = request.cookies.get("session_token")
    if token:
        delete_session(token)
    
    response = JSONResponse(
        content=standard_response(message="Logged out successfully")
    )
    response.delete_cookie("session_token")
    return response
