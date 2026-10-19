from flask import Blueprint, request, jsonify, g
from app.database import db
from app.models import Question, Answer, Interview
from app.utils.auth_helpers import token_required
from app.utils.limiter import rate_limit
from app.services.llm_service import llm_service

questions_bp = Blueprint("questions", __name__, url_prefix="/api/questions")

@questions_bp.route("/<int:question_id>/answer", methods=["POST"])
@token_required
@rate_limit(limit=25, per_seconds=60)
def submit_answer(question_id: int):
    question = db.session.get(Question, question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404

    # Verify ownership
    interview = db.session.get(Interview, question.interview_id)
    if not interview or interview.user_id != g.current_user.id:
        return jsonify({"error": "Unauthorized access to this question"}), 403

    data = request.get_json() or {}
    answer_text = str(data.get("answer_text", "")).strip()

    if not answer_text:
        return jsonify({"error": "Answer text cannot be empty."}), 400

    # Evaluate answer with LLM service
    eval_result = llm_service.evaluate_answer(
        question_text=question.text,
        answer_text=answer_text,
        role=interview.role,
        difficulty=interview.difficulty,
        is_follow_up=question.is_follow_up
    )

    # Record the answer
    answer = Answer(
        question_id=question.id,
        answer_text=answer_text,
        correctness=eval_result.get("correctness", 6.0),
        clarity=eval_result.get("clarity", 6.0),
        depth=eval_result.get("depth", 6.0),
        feedback=eval_result.get("feedback", ""),
        ideal_outline=eval_result.get("ideal_outline", "")
    )
    db.session.add(answer)

    # Check for adaptive follow-up question
    follow_up_q = None
    follow_up_text = eval_result.get("follow_up_question")
    if follow_up_text and not question.is_follow_up:
        # Check if follow-up already exists for this question
        existing_follow_up = Question.query.filter_by(parent_question_id=question.id).first()
        if not existing_follow_up:
            follow_up_q = Question(
                interview_id=interview.id,
                order=question.order,
                text=follow_up_text,
                category=question.category,
                is_follow_up=True,
                parent_question_id=question.id
            )
            db.session.add(follow_up_q)

    db.session.commit()

    return jsonify({
        "message": "Answer evaluated successfully",
        "answer": answer.to_dict(),
        "follow_up_question": follow_up_q.to_dict() if follow_up_q else None
    }), 200

@questions_bp.route("/<int:question_id>", methods=["GET"])
@token_required
def get_question(question_id: int):
    question = db.session.get(Question, question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404

    interview = db.session.get(Interview, question.interview_id)
    if not interview or interview.user_id != g.current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify({
        "question": question.to_dict(include_answers=True)
    }), 200
