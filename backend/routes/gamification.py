from fastapi import APIRouter, HTTPException, Request
from database.connection import db, get_user_by_email
from utils.security import require_auth
from utils.helpers import standard_response
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/gamification", tags=["Gamification"])

BADGES = [
    {
        "id": "first_prediction",
        "name": "First Step",
        "description": "Made your first disease prediction",
        "icon": "🔬",
        "threshold": 1,
        "collection": "predictions",
        "field": "email",
    },
    {
        "id": "prediction_5",
        "name": "Health Detective",
        "description": "Made 5 disease predictions",
        "icon": "🕵️",
        "threshold": 5,
        "collection": "predictions",
        "field": "email",
    },
    {
        "id": "prediction_20",
        "name": "Prediction Pro",
        "description": "Made 20 disease predictions",
        "icon": "🏆",
        "threshold": 20,
        "collection": "predictions",
        "field": "email",
    },
    {
        "id": "first_appointment",
        "name": "Doctor Visit",
        "description": "Booked your first appointment",
        "icon": "📅",
        "threshold": 1,
        "collection": "appointments",
        "field": "user_email",
    },
    {
        "id": "appointment_5",
        "name": "Regular Patient",
        "description": "Booked 5 appointments",
        "icon": "⭐",
        "threshold": 5,
        "collection": "appointments",
        "field": "user_email",
    },
    {
        "id": "first_medication",
        "name": "Pill Tracker",
        "description": "Added your first medication",
        "icon": "💊",
        "threshold": 1,
        "collection": "medications",
        "field": "email",
    },
    {
        "id": "first_journal",
        "name": "Health Journalist",
        "description": "Wrote your first journal entry",
        "icon": "📝",
        "threshold": 1,
        "collection": "journal_entries",
        "field": "email",
    },
    {
        "id": "journal_10",
        "name": "Diary Keeper",
        "description": "Wrote 10 journal entries",
        "icon": "📖",
        "threshold": 10,
        "collection": "journal_entries",
        "field": "email",
    },
    {
        "id": "first_report",
        "name": "Report Card",
        "description": "Generated your first health report",
        "icon": "📄",
        "threshold": 1,
        "collection": "report_downloads",
        "field": "email",
    },
    {
        "id": "family_care",
        "name": "Family Guardian",
        "description": "Added a family member profile",
        "icon": "👨‍👩‍👧‍👦",
        "threshold": 1,
        "collection": "family_profiles",
        "field": "owner_email",
    },
    {
        "id": "profile_complete",
        "name": "Identity Verified",
        "description": "Completed your health profile",
        "icon": "✅",
        "threshold": -1,
        "collection": "special",
        "field": "special",
    },
    {
        "id": "week_streak_3",
        "name": "3-Week Warrior",
        "description": "Maintained a 3-week check-in streak",
        "icon": "🔥",
        "threshold": 3,
        "collection": "special_streak",
        "field": "special",
    },
    {
        "id": "week_streak_7",
        "name": "Monthly Champion",
        "description": "Maintained a 7-week check-in streak",
        "icon": "💎",
        "threshold": 7,
        "collection": "special_streak",
        "field": "special",
    },
    {
        "id": "med_adherence_90",
        "name": "Discipline Master",
        "description": "Achieved 90%+ medication adherence",
        "icon": "🎯",
        "threshold": 90,
        "collection": "special_adherence",
        "field": "special",
    },
]

HEALTH_TIPS = [
    "Drink at least 8 glasses of water daily to stay hydrated.",
    "Take a 10-minute walk after each meal to aid digestion.",
    "Get 7-9 hours of quality sleep every night.",
    "Practice deep breathing for 5 minutes to reduce stress.",
    "Eat at least 5 servings of fruits and vegetables daily.",
    "Limit screen time to reduce eye strain — follow the 20-20-20 rule.",
    "Stretch for 5 minutes every hour if you sit for long periods.",
    "Wash your hands frequently to prevent infections.",
    "Schedule regular health check-ups, even when feeling healthy.",
    "Maintain good posture to prevent back and neck pain.",
    "Include protein in every meal to support muscle health.",
    "Reduce sodium intake to maintain healthy blood pressure.",
    "Practice gratitude daily to improve mental well-being.",
    "Stay consistent with medication schedules for best results.",
    "Track your symptoms regularly to spot patterns early.",
]


def _get_weekly_tip():
    week_number = datetime.utcnow().isocalendar()[1]
    return HEALTH_TIPS[week_number % len(HEALTH_TIPS)]


async def _check_profile_complete(email: str) -> bool:
    user = await get_user_by_email(email)
    if not user:
        return False
    required = ["name", "age", "gender", "height", "weight", "phone", "city"]
    return all(user.get(f) for f in required)


async def _calculate_streak(email: str) -> int:
    now = datetime.utcnow()
    streak = 0

    for weeks_ago in range(52):
        week_start = now - timedelta(weeks=weeks_ago + 1)
        week_end = now - timedelta(weeks=weeks_ago)

        has_activity = False

        pred_count = await db.predictions.count_documents(
            {"email": email, "created_at": {"$gte": week_start, "$lt": week_end}}
        )
        if pred_count > 0:
            has_activity = True

        if not has_activity:
            journal_count = await db.journal_entries.count_documents(
                {"email": email, "created_at": {"$gte": week_start, "$lt": week_end}}
            )
            if journal_count > 0:
                has_activity = True

        if not has_activity:
            log_count = await db.medication_logs.count_documents(
                {
                    "email": email,
                    "logged_at": {
                        "$gte": week_start.isoformat(),
                        "$lt": week_end.isoformat(),
                    },
                }
            )
            if log_count > 0:
                has_activity = True

        if has_activity:
            streak += 1
        else:
            break

    return streak


async def _get_med_adherence(email: str) -> float:
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    total_logs = await db.medication_logs.count_documents(
        {"email": email, "logged_at": {"$gte": thirty_days_ago}}
    )
    if total_logs == 0:
        return 0.0

    taken_logs = await db.medication_logs.count_documents(
        {"email": email, "logged_at": {"$gte": thirty_days_ago}, "skipped": False}
    )
    return round((taken_logs / total_logs) * 100, 1)


@router.get("")
async def get_gamification(request: Request):
    try:
        email = await require_auth(request)

        counts = {}
        collection_fields = set()
        for badge in BADGES:
            key = (badge["collection"], badge["field"])
            if key not in collection_fields and badge["collection"] not in (
                "special",
                "special_streak",
                "special_adherence",
            ):
                collection_fields.add(key)
                coll = getattr(db, badge["collection"], None)
                if coll is not None:
                    counts[key] = await coll.count_documents({badge["field"]: email})

        profile_complete = await _check_profile_complete(email)
        streak = await _calculate_streak(email)
        adherence = await _get_med_adherence(email)

        earned_badges = []
        locked_badges = []

        for badge in BADGES:
            badge_data = {
                "id": badge["id"],
                "name": badge["name"],
                "description": badge["description"],
                "icon": badge["icon"],
            }

            earned = False
            if badge["collection"] == "special":
                earned = profile_complete
            elif badge["collection"] == "special_streak":
                earned = streak >= badge["threshold"]
            elif badge["collection"] == "special_adherence":
                earned = adherence >= badge["threshold"]
            else:
                key = (badge["collection"], badge["field"])
                earned = counts.get(key, 0) >= badge["threshold"]

            if earned:
                badge_data["earned"] = True
                earned_badges.append(badge_data)
            else:
                badge_data["earned"] = False
                if badge["collection"] not in (
                    "special",
                    "special_streak",
                    "special_adherence",
                ):
                    key = (badge["collection"], badge["field"])
                    badge_data["progress"] = min(counts.get(key, 0), badge["threshold"])
                    badge_data["threshold"] = badge["threshold"]
                elif badge["collection"] == "special_streak":
                    badge_data["progress"] = streak
                    badge_data["threshold"] = badge["threshold"]
                elif badge["collection"] == "special_adherence":
                    badge_data["progress"] = adherence
                    badge_data["threshold"] = badge["threshold"]
                locked_badges.append(badge_data)

        user = await get_user_by_email(email)
        total_predictions = counts.get(("predictions", "email"), 0)
        total_appointments = counts.get(("appointments", "user_email"), 0)

        from routes.dashboard import calculate_health_score, get_health_status

        health_score = calculate_health_score(
            user or {}, total_predictions, total_appointments
        )
        health_status = get_health_status(health_score)

        level = 1
        xp = len(earned_badges) * 100
        if xp >= 1200:
            level = 6
        elif xp >= 900:
            level = 5
        elif xp >= 600:
            level = 4
        elif xp >= 400:
            level = 3
        elif xp >= 200:
            level = 2

        level_names = {
            1: "Beginner",
            2: "Aware",
            3: "Proactive",
            4: "Dedicated",
            5: "Expert",
            6: "Health Champion",
        }
        level_thresholds = {1: 200, 2: 400, 3: 600, 4: 900, 5: 1200, 6: 1400}

        return standard_response(
            message="Gamification data retrieved",
            data={
                "level": {
                    "current": level,
                    "name": level_names.get(level, "Beginner"),
                    "xp": xp,
                    "next_level_xp": level_thresholds.get(level, 1400),
                },
                "health_score": {
                    "score": health_score,
                    "status": health_status["status"],
                    "message": health_status["message"],
                    "color": health_status["color"],
                },
                "streak": {
                    "weeks": streak,
                    "message": f"{streak} week{'s' if streak != 1 else ''} active streak!"
                    if streak > 0
                    else "Start your streak by checking in this week!",
                },
                "adherence": {
                    "percentage": adherence,
                    "message": f"{adherence}% medication adherence (30 days)",
                },
                "badges": {
                    "earned": earned_badges,
                    "locked": locked_badges,
                    "total": len(BADGES),
                    "earned_count": len(earned_badges),
                },
                "weekly_tip": _get_weekly_tip(),
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gamification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load gamification data")
