"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, Dict, Any, List
import re


class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    error_code: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    phone_number: str = Field(..., min_length=10, max_length=15)
    age: int = Field(..., ge=1, le=150)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot exceed 72 bytes')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        return v


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    age: Optional[int] = Field(None, ge=1, le=150)
    gender: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    pressure: Optional[str] = None
    bmi: Optional[str] = None


class AppointmentRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    date: str
    time: str
    doctorName: str = Field(..., min_length=1)
    doctorSpecialization: str
    doctorCity: str
    doctorLocation: str


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    details: str = Field(..., min_length=10)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    context: Optional[Dict[str, Any]] = None


class DrugInteractionRequest(BaseModel):
    medications: List[str] = Field(..., min_items=2)


class SymptomPredictionRequest(BaseModel):
    symptoms: Dict[str, Any]

class SymptomAnalysisRequest(BaseModel):
    symptoms: str
