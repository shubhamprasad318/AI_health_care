"""Database module"""

from .connection import db, create_indexes, close_connection, get_user_by_email
from .models import *
