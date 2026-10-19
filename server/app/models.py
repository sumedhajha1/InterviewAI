import json
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app.database import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    interviews = db.relationship("Interview", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Interview(db.Model):
    __tablename__ = "interviews"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # Full Stack, Backend, Data/ML
    difficulty = db.Column(db.String(20), nullable=False)  # Easy, Medium, Hard
    num_questions = db.Column(db.Integer, nullable=False, default=5)
    status = db.Column(db.String(20), nullable=False, default="in_progress")  # in_progress, completed
    overall_score = db.Column(db.Float, nullable=True)
    strengths_raw = db.Column(db.Text, nullable=True)  # JSON serialized list
    weak_areas_raw = db.Column(db.Text, nullable=True)  # JSON serialized list
    improvement_plan_raw = db.Column(db.Text, nullable=True)  # JSON serialized 5-point list
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)

    questions = db.relationship("Question", backref="interview", lazy=True, cascade="all, delete-orphan", order_by="Question.order")

    @property
    def strengths(self):
        if self.strengths_raw:
            try:
                return json.loads(self.strengths_raw)
            except Exception:
                return []
        return []

    @strengths.setter
    def strengths(self, value):
        self.strengths_raw = json.dumps(value) if value else None

    @property
    def weak_areas(self):
        if self.weak_areas_raw:
            try:
                return json.loads(self.weak_areas_raw)
            except Exception:
                return []
        return []

    @weak_areas.setter
    def weak_areas(self, value):
        self.weak_areas_raw = json.dumps(value) if value else None

    @property
    def improvement_plan(self):
        if self.improvement_plan_raw:
            try:
                return json.loads(self.improvement_plan_raw)
            except Exception:
                return []
        return []

    @improvement_plan.setter
    def improvement_plan(self, value):
        self.improvement_plan_raw = json.dumps(value) if value else None

    def to_dict(self, include_questions=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "role": self.role,
            "difficulty": self.difficulty,
            "num_questions": self.num_questions,
            "status": self.status,
            "overall_score": round(self.overall_score, 1) if self.overall_score is not None else None,
            "strengths": self.strengths,
            "weak_areas": self.weak_areas,
            "improvement_plan": self.improvement_plan,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
        if include_questions:
            data["questions"] = [q.to_dict(include_answers=True) for q in self.questions]
        return data


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey("interviews.id"), nullable=False)
    order = db.Column(db.Integer, nullable=False, default=1)
    text = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(80), nullable=True, default="General")
    is_follow_up = db.Column(db.Boolean, default=False)
    parent_question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    answers = db.relationship("Answer", backref="question", lazy=True, cascade="all, delete-orphan")
    follow_ups = db.relationship("Question", backref=db.backref("parent", remote_side=[id]), lazy=True)

    def to_dict(self, include_answers=True):
        data = {
            "id": self.id,
            "interview_id": self.interview_id,
            "order": self.order,
            "text": self.text,
            "category": self.category,
            "is_follow_up": self.is_follow_up,
            "parent_question_id": self.parent_question_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
        if include_answers:
            data["answers"] = [a.to_dict() for a in self.answers]
            # Helper for active answer (latest)
            data["latest_answer"] = self.answers[-1].to_dict() if self.answers else None
        return data


class Answer(db.Model):
    __tablename__ = "answers"

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=False)
    answer_text = db.Column(db.Text, nullable=False)
    correctness = db.Column(db.Float, nullable=False, default=0.0)
    clarity = db.Column(db.Float, nullable=False, default=0.0)
    depth = db.Column(db.Float, nullable=False, default=0.0)
    feedback = db.Column(db.Text, nullable=True)
    ideal_outline = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def average_score(self):
        return round((self.correctness + self.clarity + self.depth) / 3.0, 1)

    def to_dict(self):
        return {
            "id": self.id,
            "question_id": self.question_id,
            "answer_text": self.answer_text,
            "correctness": round(self.correctness, 1),
            "clarity": round(self.clarity, 1),
            "depth": round(self.depth, 1),
            "average_score": self.average_score,
            "feedback": self.feedback,
            "ideal_outline": self.ideal_outline,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
