"""
MongoDB database connection
"""

from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import MONGO_URI, MONGO_DBNAME
import logging

from typing import Optional, Dict


logger = logging.getLogger(__name__)

client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DBNAME]


async def get_user_by_email(email: str) -> Optional[Dict]:
    return await db.store.find_one({"email": email})


async def create_indexes():
    """Create MongoDB indexes"""
    try:
        await db.store.create_index("email", unique=True)
        await db.appointments.create_index("email")
        await db.appointments.create_index("date")
        await db.files.create_index("email")
        await db.predictions.create_index("email")
        await db.predictions.create_index("created_at")
        await db.chat_history.create_index("email")
        await db.health_plans.create_index("email")
        await db.medications.create_index("email")
        await db.medications.create_index([("email", 1), ("active", 1)])
        await db.medication_logs.create_index("email")
        await db.medication_logs.create_index("medication_id")
        await db.journal_entries.create_index("email")
        await db.journal_entries.create_index([("email", 1), ("created_at", -1)])
        await db.family_profiles.create_index("owner_email")
        await db.notifications.create_index("email")
        await db.notifications.create_index([("email", 1), ("read", 1)])
        await db.doctors.create_index("specialization")
        await db.doctors.create_index("city")
        await db.doctors.create_index([("avg_rating", -1)])
        await db.doctor_reviews.create_index("doctor_id")
        await db.doctor_reviews.create_index(
            [("doctor_id", 1), ("email", 1)], unique=True
        )
        logger.info("Database indexes created")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")


def close_connection():
    """Close database connection"""
    client.close()
