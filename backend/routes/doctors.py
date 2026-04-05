"""
Doctor Directory & Reviews Routes
File Path: routes/doctors.py
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional
from database.models import DoctorCreate, DoctorReviewCreate
from database.connection import db, get_user_by_email
from utils.security import require_auth
from utils.helpers import standard_response, serialize_doc
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import logging
import re

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/doctors", tags=["Doctors"])

ADMIN_EMAIL = "aayush.chodvadiya.cse@gmail.com"


@router.post("")
async def add_doctor(request: Request, doctor: DoctorCreate):
    """Add a new doctor to the directory (admin only)"""
    try:
        email = await require_auth(request)
        if email != ADMIN_EMAIL:
            raise HTTPException(status_code=403, detail="Admin access required")

        doctor_data = doctor.dict()
        doctor_data["added_by"] = email
        doctor_data["created_at"] = datetime.utcnow().isoformat()
        doctor_data["avg_rating"] = 0.0
        doctor_data["review_count"] = 0
        doctor_data["active"] = True

        result = await db.doctors.insert_one(doctor_data)

        return standard_response(
            message="Doctor added successfully",
            data={"doctor_id": str(result.inserted_id)},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add doctor error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add doctor")


@router.get("")
async def list_doctors(
    request: Request,
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    city: Optional[str] = Query(None, description="Filter by city"),
    search: Optional[str] = Query(None, description="Search by name"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum rating"),
    sort_by: str = Query("avg_rating", pattern="^(avg_rating|name|review_count)$"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
):
    """List doctors with filters"""
    try:
        query: dict = {"active": True}

        if specialization:
            query["specialization"] = {"$regex": specialization, "$options": "i"}
        if city:
            query["city"] = {"$regex": city, "$options": "i"}
        if search:
            query["name"] = {"$regex": re.escape(search), "$options": "i"}
        if min_rating is not None:
            query["avg_rating"] = {"$gte": min_rating}

        sort_direction = -1 if sort_by in ("avg_rating", "review_count") else 1
        cursor = (
            db.doctors.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
        )
        doctors = await cursor.to_list(length=limit)

        total = await db.doctors.count_documents(query)

        for doc in doctors:
            serialize_doc(doc)

        return standard_response(
            message="Doctors retrieved successfully",
            data={
                "doctors": doctors,
                "total": total,
                "limit": limit,
                "skip": skip,
            },
        )
    except Exception as e:
        logger.error(f"List doctors error: {e}")
        raise HTTPException(status_code=500, detail="Failed to list doctors")


@router.get("/specializations")
async def get_specializations():
    """Get list of unique specializations"""
    try:
        specializations = await db.doctors.distinct("specialization", {"active": True})
        return standard_response(
            message="Specializations retrieved",
            data={"specializations": sorted(specializations)},
        )
    except Exception as e:
        logger.error(f"Get specializations error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get specializations")


@router.get("/cities")
async def get_cities():
    """Get list of unique cities"""
    try:
        cities = await db.doctors.distinct("city", {"active": True})
        return standard_response(
            message="Cities retrieved",
            data={"cities": sorted(cities)},
        )
    except Exception as e:
        logger.error(f"Get cities error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get cities")


@router.get("/{doctor_id}")
async def get_doctor(doctor_id: str):
    """Get doctor details with reviews"""
    try:
        try:
            oid = ObjectId(doctor_id)
        except (InvalidId, Exception):
            raise HTTPException(status_code=400, detail="Invalid doctor ID")

        doctor = await db.doctors.find_one({"_id": oid, "active": True})
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        serialize_doc(doctor)

        # Get reviews for this doctor
        review_cursor = (
            db.doctor_reviews.find({"doctor_id": doctor_id})
            .sort("created_at", -1)
            .limit(50)
        )
        reviews = await review_cursor.to_list(length=50)
        for review in reviews:
            serialize_doc(review)

        doctor["reviews"] = reviews

        return standard_response(
            message="Doctor details retrieved",
            data={"doctor": doctor},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get doctor error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get doctor")


@router.post("/{doctor_id}/reviews")
async def add_review(request: Request, doctor_id: str, review: DoctorReviewCreate):
    """Add a review for a doctor"""
    try:
        email = await require_auth(request)

        try:
            oid = ObjectId(doctor_id)
        except (InvalidId, Exception):
            raise HTTPException(status_code=400, detail="Invalid doctor ID")

        # Check doctor exists
        doctor = await db.doctors.find_one({"_id": oid, "active": True})
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        # Check if user already reviewed this doctor
        existing = await db.doctor_reviews.find_one(
            {"doctor_id": doctor_id, "email": email}
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail="You have already reviewed this doctor. You can update your existing review.",
            )

        # Get user info for review display
        user = await get_user_by_email(email)
        user_name = "Anonymous"
        if user:
            first = user.get("first_name", "")
            last = user.get("last_name", "")
            user_name = f"{first} {last}".strip() or "Anonymous"

        review_data = review.dict()
        review_data["doctor_id"] = doctor_id
        review_data["email"] = email
        review_data["user_name"] = user_name
        review_data["created_at"] = datetime.utcnow().isoformat()

        await db.doctor_reviews.insert_one(review_data)

        # Update doctor's average rating
        pipeline = [
            {"$match": {"doctor_id": doctor_id}},
            {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
        ]
        agg_result = await db.doctor_reviews.aggregate(pipeline).to_list(length=1)

        if agg_result:
            avg_rating = round(agg_result[0]["avg"], 1)
            review_count = agg_result[0]["count"]
        else:
            avg_rating = review.rating
            review_count = 1

        await db.doctors.update_one(
            {"_id": oid},
            {"$set": {"avg_rating": avg_rating, "review_count": review_count}},
        )

        return standard_response(
            message="Review added successfully",
            data={"avg_rating": avg_rating, "review_count": review_count},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add review error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add review")


@router.patch("/{doctor_id}/reviews")
async def update_review(request: Request, doctor_id: str, review: DoctorReviewCreate):
    """Update user's existing review for a doctor"""
    try:
        email = await require_auth(request)

        try:
            oid = ObjectId(doctor_id)
        except (InvalidId, Exception):
            raise HTTPException(status_code=400, detail="Invalid doctor ID")

        # Check doctor exists
        doctor = await db.doctors.find_one({"_id": oid, "active": True})
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        # Update review
        result = await db.doctor_reviews.update_one(
            {"doctor_id": doctor_id, "email": email},
            {
                "$set": {
                    "rating": review.rating,
                    "comment": review.comment,
                    "updated_at": datetime.utcnow().isoformat(),
                }
            },
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Review not found")

        # Recalculate average
        pipeline = [
            {"$match": {"doctor_id": doctor_id}},
            {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
        ]
        agg_result = await db.doctor_reviews.aggregate(pipeline).to_list(length=1)

        if agg_result:
            avg_rating = round(agg_result[0]["avg"], 1)
            review_count = agg_result[0]["count"]
            await db.doctors.update_one(
                {"_id": oid},
                {"$set": {"avg_rating": avg_rating, "review_count": review_count}},
            )
        else:
            avg_rating = review.rating
            review_count = 1

        return standard_response(
            message="Review updated successfully",
            data={"avg_rating": avg_rating, "review_count": review_count},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update review error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update review")


@router.delete("/{doctor_id}/reviews")
async def delete_review(request: Request, doctor_id: str):
    """Delete user's review for a doctor"""
    try:
        email = await require_auth(request)

        try:
            oid = ObjectId(doctor_id)
        except (InvalidId, Exception):
            raise HTTPException(status_code=400, detail="Invalid doctor ID")

        result = await db.doctor_reviews.delete_one(
            {"doctor_id": doctor_id, "email": email}
        )

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Review not found")

        # Recalculate average
        pipeline = [
            {"$match": {"doctor_id": doctor_id}},
            {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
        ]
        agg_result = await db.doctor_reviews.aggregate(pipeline).to_list(length=1)

        if agg_result:
            avg_rating = round(agg_result[0]["avg"], 1)
            review_count = agg_result[0]["count"]
        else:
            avg_rating = 0.0
            review_count = 0

        await db.doctors.update_one(
            {"_id": oid},
            {"$set": {"avg_rating": avg_rating, "review_count": review_count}},
        )

        return standard_response(
            message="Review deleted successfully",
            data={"avg_rating": avg_rating, "review_count": review_count},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete review error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete review")


@router.post("/seed")
async def seed_doctors(request: Request):
    """Seed initial doctor data (admin only, one-time use)"""
    try:
        email = await require_auth(request)
        if email != ADMIN_EMAIL:
            raise HTTPException(status_code=403, detail="Admin access required")

        # Check if already seeded
        count = await db.doctors.count_documents({})
        if count > 0:
            return standard_response(
                message=f"Database already has {count} doctors. Skipping seed.",
                data={"count": count},
            )

        seed_data = [
            {
                "name": "Dr. Priya Sharma",
                "specialization": "Cardiology",
                "city": "Mumbai",
                "location": "Breach Candy Hospital, Mumbai",
                "experience_years": 15,
                "qualification": "MD, DM Cardiology",
                "phone": "+91-9876543210",
                "consultation_fee": 1500,
                "available_days": ["Monday", "Wednesday", "Friday"],
                "bio": "Senior cardiologist with 15+ years of experience in interventional cardiology and heart failure management.",
            },
            {
                "name": "Dr. Rajesh Kumar",
                "specialization": "Dermatology",
                "city": "Delhi",
                "location": "AIIMS, New Delhi",
                "experience_years": 12,
                "qualification": "MD Dermatology",
                "phone": "+91-9876543211",
                "consultation_fee": 1000,
                "available_days": ["Tuesday", "Thursday", "Saturday"],
                "bio": "Expert dermatologist specializing in skin allergies, cosmetic dermatology, and autoimmune skin conditions.",
            },
            {
                "name": "Dr. Ananya Patel",
                "specialization": "Pediatrics",
                "city": "Ahmedabad",
                "location": "Sterling Hospital, Ahmedabad",
                "experience_years": 10,
                "qualification": "MD Pediatrics, Fellowship in Neonatology",
                "phone": "+91-9876543212",
                "consultation_fee": 800,
                "available_days": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                ],
                "bio": "Dedicated pediatrician with special focus on neonatal care and childhood developmental disorders.",
            },
            {
                "name": "Dr. Suresh Reddy",
                "specialization": "Orthopedics",
                "city": "Hyderabad",
                "location": "Apollo Hospital, Hyderabad",
                "experience_years": 20,
                "qualification": "MS Orthopedics, Fellowship in Joint Replacement",
                "phone": "+91-9876543213",
                "consultation_fee": 1200,
                "available_days": ["Monday", "Wednesday", "Friday", "Saturday"],
                "bio": "Leading orthopedic surgeon with expertise in joint replacement, sports injuries, and spinal disorders.",
            },
            {
                "name": "Dr. Meera Iyer",
                "specialization": "Neurology",
                "city": "Bangalore",
                "location": "Manipal Hospital, Bangalore",
                "experience_years": 18,
                "qualification": "DM Neurology",
                "phone": "+91-9876543214",
                "consultation_fee": 2000,
                "available_days": ["Tuesday", "Thursday"],
                "bio": "Renowned neurologist specializing in stroke management, epilepsy, and neurodegenerative disorders.",
            },
            {
                "name": "Dr. Vikram Singh",
                "specialization": "General Medicine",
                "city": "Jaipur",
                "location": "Fortis Hospital, Jaipur",
                "experience_years": 8,
                "qualification": "MD General Medicine",
                "phone": "+91-9876543215",
                "consultation_fee": 600,
                "available_days": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                ],
                "bio": "Experienced general physician with expertise in diabetes management, hypertension, and preventive healthcare.",
            },
            {
                "name": "Dr. Kavitha Nair",
                "specialization": "Gynecology",
                "city": "Chennai",
                "location": "Kauvery Hospital, Chennai",
                "experience_years": 14,
                "qualification": "MS OBG, Fellowship in Reproductive Medicine",
                "phone": "+91-9876543216",
                "consultation_fee": 1100,
                "available_days": ["Monday", "Wednesday", "Friday"],
                "bio": "Experienced gynecologist specializing in high-risk pregnancies, infertility treatment, and minimally invasive surgery.",
            },
            {
                "name": "Dr. Amit Joshi",
                "specialization": "Ophthalmology",
                "city": "Pune",
                "location": "Aditya Birla Hospital, Pune",
                "experience_years": 11,
                "qualification": "MS Ophthalmology, Fellowship in Retina",
                "phone": "+91-9876543217",
                "consultation_fee": 900,
                "available_days": ["Tuesday", "Thursday", "Saturday"],
                "bio": "Ophthalmologist with expertise in retinal surgery, cataract surgery, and diabetic eye disease management.",
            },
            {
                "name": "Dr. Fatima Khan",
                "specialization": "Psychiatry",
                "city": "Mumbai",
                "location": "Kokilaben Hospital, Mumbai",
                "experience_years": 9,
                "qualification": "MD Psychiatry",
                "phone": "+91-9876543218",
                "consultation_fee": 1800,
                "available_days": ["Monday", "Wednesday", "Friday"],
                "bio": "Compassionate psychiatrist specializing in anxiety disorders, depression, and cognitive behavioral therapy.",
            },
            {
                "name": "Dr. Arjun Menon",
                "specialization": "Pulmonology",
                "city": "Kochi",
                "location": "Amrita Hospital, Kochi",
                "experience_years": 16,
                "qualification": "DM Pulmonary Medicine",
                "phone": "+91-9876543219",
                "consultation_fee": 1300,
                "available_days": ["Monday", "Tuesday", "Thursday", "Friday"],
                "bio": "Pulmonologist with extensive experience in respiratory diseases, asthma management, and interventional pulmonology.",
            },
        ]

        for doc in seed_data:
            doc["added_by"] = email
            doc["created_at"] = datetime.utcnow().isoformat()
            doc["avg_rating"] = 0.0
            doc["review_count"] = 0
            doc["active"] = True

        await db.doctors.insert_many(seed_data)

        return standard_response(
            message=f"Seeded {len(seed_data)} doctors successfully",
            data={"count": len(seed_data)},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Seed doctors error: {e}")
        raise HTTPException(status_code=500, detail="Failed to seed doctors")
