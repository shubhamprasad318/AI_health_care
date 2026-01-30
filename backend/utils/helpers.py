"""
Helper utility functions
"""
from typing import Dict, Optional, Any, List
from collections import Counter
import re


def standard_response(success: bool = True, data: Optional[Dict] = None, 
                     message: str = "", error_code: Optional[str] = None) -> Dict:
    """Standard API response format"""
    response = {
        "success": success,
        "message": message
    }
    if data is not None:
        response["data"] = data
    if error_code:
        response["error_code"] = error_code
    return response


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def allowed_file(filename: str, allowed_extensions: set) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def mode(arr: List[str]) -> str:
    """Get most common element in list"""
    counter = Counter(arr)
    max_count = max(counter.values())
    return next(k for k, v in counter.items() if v == max_count)
