from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.database import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    
    # Enable CORS for all routes under /api/*
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.interviews import interviews_bp
    from app.routes.questions import questions_bp
    from app.routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(interviews_bp)
    app.register_blueprint(questions_bp)
    app.register_blueprint(dashboard_bp)

    # Base health check endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "InterviewAI Backend API",
            "version": "1.0.0"
        }), 200

    # Error Handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"error": "Resource not found", "code": "NOT_FOUND"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({"error": "Internal server error occurred", "code": "SERVER_ERROR"}), 500

    # Auto-create tables on startup
    with app.app_context():
        db.create_all()

    return app
