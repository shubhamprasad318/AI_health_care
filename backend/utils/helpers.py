"""
Helper utility functions
"""

from typing import Dict, Optional, Any, List
from collections import Counter
from datetime import datetime
from bson import ObjectId
import json
import re


def standard_response(
    success: bool = True,
    data: Optional[Dict] = None,
    message: str = "",
    error_code: Optional[str] = None,
) -> Dict:
    """Standard API response format"""
    response = {"success": success, "message": message}
    if data is not None:
        response["data"] = data
    if error_code:
        response["error_code"] = error_code
    return response


def serialize_doc(doc: Optional[Dict]) -> Optional[Dict]:
    """Convert MongoDB document _id from ObjectId to string for JSON serialization"""
    if doc is None:
        return None
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def serialize_mongo_doc(doc: Dict) -> Dict:
    """Deep-serialize a MongoDB document: ObjectId -> str, datetime -> ISO string"""
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result


def serialize_date(val, fmt: str = "iso") -> str:
    """Convert datetime or string to formatted date string.

    Args:
        val: datetime object, ISO string, or any value
        fmt: 'iso' for ISO format, 'human' for 'Jan 01, 2025 12:00 PM'
    """
    if fmt == "human":
        if isinstance(val, datetime):
            return val.strftime("%b %d, %Y %I:%M %p")
        if isinstance(val, str):
            try:
                dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
                return dt.strftime("%b %d, %Y %I:%M %p")
            except (ValueError, TypeError):
                return val
        return str(val) if val else "N/A"
    else:
        if isinstance(val, datetime):
            return val.isoformat()
        return str(val) if val else ""


def safe_str(val, default: str = "") -> str:
    """Safely convert value to string. Lists joined with '; ', dicts to JSON."""
    if val is None:
        return default
    if isinstance(val, list):
        return "; ".join(str(v) for v in val)
    if isinstance(val, dict):
        return json.dumps(val)
    return str(val)


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def allowed_file(filename: str, allowed_extensions: set) -> bool:
    """Check if file extension is allowed"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions


def mode(arr: List[str]) -> str:
    """Get most common element in list"""
    counter = Counter(arr)
    max_count = max(counter.values())
    return next(k for k, v in counter.items() if v == max_count)
