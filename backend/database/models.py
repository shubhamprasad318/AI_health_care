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

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password cannot exceed 72 bytes")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
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
    language: Optional[str] = Field(None, pattern="^(en|hi)$")


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


class MedicationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    dosage: str = Field(..., min_length=1, max_length=100)
    frequency: str = Field(
        ...,
        pattern="^(once_daily|twice_daily|three_times|four_times|every_x_hours|as_needed|weekly)$",
    )
    times: List[str] = Field(..., min_items=1)
    start_date: str
    end_date: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=500)
    reminder_enabled: bool = True


class MedicationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    dosage: Optional[str] = Field(None, min_length=1, max_length=100)
    frequency: Optional[str] = Field(
        None,
        pattern="^(once_daily|twice_daily|three_times|four_times|every_x_hours|as_needed|weekly)$",
    )
    times: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=500)
    reminder_enabled: Optional[bool] = None
    active: Optional[bool] = None


class MedicationLogCreate(BaseModel):
    medication_id: str
    taken_at: Optional[str] = None
    skipped: bool = False
    notes: Optional[str] = Field(None, max_length=300)


class SymptomJournalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)
    mood: Optional[str] = Field(None, pattern="^(great|good|okay|bad|terrible)$")
    symptoms: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    pain_level: Optional[int] = Field(None, ge=0, le=10)


class SymptomJournalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    mood: Optional[str] = Field(None, pattern="^(great|good|okay|bad|terrible)$")
    symptoms: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    pain_level: Optional[int] = Field(None, ge=0, le=10)


class DoctorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    specialization: str = Field(..., min_length=1, max_length=100)
    city: str = Field(..., min_length=1, max_length=100)
    location: str = Field(..., min_length=1, max_length=300)
    experience_years: int = Field(..., ge=0, le=60)
    qualification: str = Field(..., min_length=1, max_length=300)
    phone: Optional[str] = Field(None, max_length=20)
    consultation_fee: Optional[int] = Field(None, ge=0)
    available_days: Optional[List[str]] = None
    bio: Optional[str] = Field(None, max_length=2000)


class DoctorReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


class FamilyProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    relationship: str = Field(
        ...,
        pattern="^(spouse|child|parent|sibling|grandparent|other)$",
    )
    age: Optional[int] = Field(None, ge=0, le=150)
    gender: Optional[str] = Field(None, pattern="^(Male|Female|Other)$")
    blood_type: Optional[str] = Field(
        None,
        pattern="^(A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-)$",
    )
    allergies: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=1000)


class FamilyProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    relationship: Optional[str] = Field(
        None,
        pattern="^(spouse|child|parent|sibling|grandparent|other)$",
    )
    age: Optional[int] = Field(None, ge=0, le=150)
    gender: Optional[str] = Field(None, pattern="^(Male|Female|Other)$")
    blood_type: Optional[str] = Field(
        None,
        pattern="^(A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-)$",
    )
    allergies: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=1000)
