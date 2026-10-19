from collections import defaultdict
from flask import Blueprint, jsonify, g
from app.models import Interview, Question, Answer
from app.utils.auth_helpers import token_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/stats", methods=["GET"])
@token_required
def get_dashboard_stats():
    user_id = g.current_user.id

    # Retrieve all interviews for user
    interviews = Interview.query.filter_by(user_id=user_id).order_by(Interview.created_at.desc()).all()
    
    total_interviews = len(interviews)
    completed_interviews = [i for i in interviews if i.status == "completed" and i.overall_score is not None]
    
    avg_score = 0.0
    if completed_interviews:
        avg_score = round(sum(i.overall_score for i in completed_interviews) / len(completed_interviews), 1)

    # Score over time for Recharts (chronological order)
    score_history = []
    for i in sorted(completed_interviews, key=lambda x: x.created_at):
        date_str = i.completed_at.strftime("%b %d") if i.completed_at else i.created_at.strftime("%b %d")
        score_history.append({
            "interview_id": i.id,
            "date": date_str,
            "score": round(i.overall_score, 1),
            "role": i.role,
            "difficulty": i.difficulty
        })

    # Topic performance breakdown across all answers
    topic_scores = defaultdict(list)
    interview_ids = [i.id for i in interviews]
    if interview_ids:
        questions = Question.query.filter(Question.interview_id.in_(interview_ids)).all()
        for q in questions:
            for ans in q.answers:
                score = (ans.correctness + ans.clarity + ans.depth) / 3.0
                topic = q.category or "General"
                topic_scores[topic].append(score)

    topic_breakdown = []
    for topic, scores in topic_scores.items():
        if scores:
            topic_breakdown.append({
                "topic": topic,
                "average_score": round((sum(scores) / len(scores)) * 10.0, 1),  # convert to 0-100 scale
                "count": len(scores)
            })

    # Sort topics: weakest first
    topic_breakdown.sort(key=lambda x: x["average_score"])
    weakest_topics = topic_breakdown[:3]
    strongest_topics = sorted(topic_breakdown, key=lambda x: x["average_score"], reverse=True)[:3]

    return jsonify({
        "total_interviews": total_interviews,
        "completed_count": len(completed_interviews),
        "in_progress_count": total_interviews - len(completed_interviews),
        "average_score": avg_score,
        "score_history": score_history,
        "topic_breakdown": topic_breakdown,
        "weakest_topics": weakest_topics,
        "strongest_topics": strongest_topics,
        "recent_interviews": [i.to_dict(include_questions=False) for i in interviews[:5]]
    }), 200
