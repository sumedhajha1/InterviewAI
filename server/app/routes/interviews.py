from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from app.database import db
from app.models import Interview, Question, Answer
from app.utils.auth_helpers import token_required
from app.utils.limiter import rate_limit
from app.services.llm_service import llm_service

interviews_bp = Blueprint("interviews", __name__, url_prefix="/api/interviews")

VALID_ROLES = {"Full Stack", "Backend", "Data/ML"}
VALID_DIFFICULTIES = {"Easy", "Medium", "Hard"}

@interviews_bp.route("", methods=["POST"])
@token_required
@rate_limit(limit=10, per_seconds=60)
def create_interview():
    data = request.get_json() or {}
    role = data.get("role", "Full Stack")
    difficulty = data.get("difficulty", "Medium")
    num_questions = data.get("num_questions", 5)

    if role not in VALID_ROLES:
        return jsonify({"error": f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}"}), 400

    if difficulty not in VALID_DIFFICULTIES:
        return jsonify({"error": f"Invalid difficulty. Must be one of: {', '.join(VALID_DIFFICULTIES)}"}), 400

    try:
        num_questions = int(num_questions)
        if not (3 <= num_questions <= 10):
            return jsonify({"error": "Number of questions must be between 3 and 10."}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "num_questions must be an integer between 3 and 10."}), 400

    # Create Interview model
    interview = Interview(
        user_id=g.current_user.id,
        role=role,
        difficulty=difficulty,
        num_questions=num_questions,
        status="in_progress"
    )
    db.session.add(interview)
    db.session.flush()  # Get interview.id

    # Generate questions via LLM Service
    generated_questions = llm_service.generate_questions(role, difficulty, num_questions)
    
    # Save Question entities
    for idx, q_data in enumerate(generated_questions, start=1):
        question = Question(
            interview_id=interview.id,
            order=idx,
            text=q_data.get("text", "Explain core architecture principles."),
            category=q_data.get("category", "General"),
            is_follow_up=False
        )
        db.session.add(question)

    db.session.commit()

    return jsonify({
        "message": "Interview created successfully",
        "interview": interview.to_dict(include_questions=True)
    }), 201

@interviews_bp.route("", methods=["GET"])
@token_required
def list_interviews():
    interviews = (
        Interview.query.filter_by(user_id=g.current_user.id)
        .order_by(Interview.created_at.desc())
        .all()
    )
    return jsonify({
        "interviews": [i.to_dict(include_questions=False) for i in interviews]
    }), 200

@interviews_bp.route("/<int:interview_id>", methods=["GET"])
@token_required
def get_interview(interview_id: int):
    interview = Interview.query.filter_by(id=interview_id, user_id=g.current_user.id).first()
    if not interview:
        return jsonify({"error": "Interview not found"}), 404

    return jsonify({
        "interview": interview.to_dict(include_questions=True)
    }), 200

@interviews_bp.route("/<int:interview_id>/complete", methods=["POST"])
@token_required
@rate_limit(limit=10, per_seconds=60)
def complete_interview(interview_id: int):
    interview = Interview.query.filter_by(id=interview_id, user_id=g.current_user.id).first()
    if not interview:
        return jsonify({"error": "Interview not found"}), 404

    # Collect questions and candidate answers
    qa_data = []
    total_answers = 0
    for q in interview.questions:
        latest_answer = q.answers[-1] if q.answers else None
        if latest_answer:
            total_answers += 1
            qa_data.append({
                "question_text": q.text,
                "category": q.category,
                "answer_text": latest_answer.answer_text,
                "scores": {
                    "correctness": latest_answer.correctness,
                    "clarity": latest_answer.clarity,
                    "depth": latest_answer.depth
                }
            })

    # Generate final synthesized report
    report = llm_service.generate_final_report(interview.role, interview.difficulty, qa_data)

    interview.status = "completed"
    interview.overall_score = report.get("overall_score", 70.0)
    interview.strengths = report.get("strengths", [])
    interview.weak_areas = report.get("weak_areas", [])
    interview.improvement_plan = report.get("improvement_plan", [])
    interview.completed_at = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify({
        "message": "Interview completed successfully",
        "interview": interview.to_dict(include_questions=True),
        "report": report
    }), 200

@interviews_bp.route("/<int:interview_id>/report", methods=["GET"])
@token_required
def get_interview_report(interview_id: int):
    interview = Interview.query.filter_by(id=interview_id, user_id=g.current_user.id).first()
    if not interview:
        return jsonify({"error": "Interview not found"}), 404

    return jsonify({
        "interview": interview.to_dict(include_questions=True),
        "report": {
            "overall_score": interview.overall_score,
            "strengths": interview.strengths,
            "weak_areas": interview.weak_areas,
            "improvement_plan": interview.improvement_plan,
            "completed_at": interview.completed_at.isoformat() if interview.completed_at else None
        }
    }), 200
