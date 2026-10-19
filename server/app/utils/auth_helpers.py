import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, current_app, g
from app.database import db
from app.models import User

def generate_token(user_id: int) -> str:
    """Generate a JWT token for a user."""
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=current_app.config.get("JWT_EXPIRATION_HOURS", 24))
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")

def decode_token(token: str):
    """Decode a JWT token and return the payload."""
    try:
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to require a valid JWT token for protected routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header is missing", "code": "AUTH_HEADER_MISSING"}), 401
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid Authorization header format. Expected 'Bearer <token>'", "code": "AUTH_FORMAT_INVALID"}), 401
        
        token = parts[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Token is invalid or has expired", "code": "TOKEN_INVALID"}), 401
        
        user = db.session.get(User, payload["sub"])
        if not user:
            return jsonify({"error": "User belonging to this token no longer exists", "code": "USER_NOT_FOUND"}), 401
        
        g.current_user = user
        return f(*args, **kwargs)
    return decorated
