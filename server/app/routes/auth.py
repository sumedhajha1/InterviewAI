import re
from flask import Blueprint, request, jsonify, g
from app.database import db
from app.models import User
from app.utils.auth_helpers import generate_token, token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_REGEX = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    identifier = str(data.get("username") or data.get("email") or "").strip()
    username = str(data.get("username", "")).strip() or identifier
    raw_email = str(data.get("email", "")).strip().lower()
    email = raw_email if "@" in raw_email else f"{username.lower()}@interviewai.local"
    password = str(data.get("password", "")).strip()

    if not username or len(username) < 2:
        return jsonify({"error": "Username must be at least 2 characters long.", "field": "username"}), 400

    if not password or len(password) < 4:
        return jsonify({"error": "Password must be at least 4 characters long.", "field": "password"}), 400

    existing_user = User.query.filter((User.email == email) | (User.username == username)).first()
    if existing_user:
        return jsonify({"error": "An account with this username or email already exists.", "field": "username"}), 409

    user = User(email=email, username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id)
    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": user.to_dict()
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = str(data.get("username") or data.get("email") or "").strip().lower()
    password = str(data.get("password", "")).strip()

    if not identifier or not password:
        return jsonify({"error": "Username/Email and password are required."}), 400

    user = User.query.filter((User.email.ilike(identifier)) | (User.username.ilike(identifier))).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password."}), 401

    token = generate_token(user.id)
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict()
    }), 200

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    return jsonify({
        "user": g.current_user.to_dict()
    }), 200
