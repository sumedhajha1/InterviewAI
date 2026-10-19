from unittest.mock import patch

def test_create_interview_and_generate_questions(client, auth_headers):
    mock_questions = [
        {"text": "Explain React Virtual DOM and reconciliation.", "category": "Frontend"},
        {"text": "How do you optimize SQL query performance?", "category": "Databases"},
        {"text": "Describe CORS preflight request handling.", "category": "Networking"}
    ]

    with patch("app.routes.interviews.llm_service.generate_questions", return_value=mock_questions):
        response = client.post("/api/interviews", headers=auth_headers, json={
            "role": "Full Stack",
            "difficulty": "Medium",
            "num_questions": 3
        })

    assert response.status_code == 201
    data = response.get_json()
    interview = data["interview"]
    assert interview["role"] == "Full Stack"
    assert interview["difficulty"] == "Medium"
    assert interview["status"] == "in_progress"
    assert len(interview["questions"]) == 3
    assert interview["questions"][0]["text"] == "Explain React Virtual DOM and reconciliation."

def test_submit_answer_and_follow_up_generation(client, auth_headers):
    # First create an interview
    mock_questions = [{"text": "Explain REST vs GraphQL.", "category": "API"}]
    with patch("app.routes.interviews.llm_service.generate_questions", return_value=mock_questions):
        res = client.post("/api/interviews", headers=auth_headers, json={
            "role": "Backend",
            "difficulty": "Hard",
            "num_questions": 3
        })
    interview = res.get_json()["interview"]
    question_id = interview["questions"][0]["id"]

    mock_eval = {
        "correctness": 8.5,
        "clarity": 8.0,
        "depth": 7.5,
        "feedback": "Great overview of tradeoffs between over-fetching and schema complexity.",
        "ideal_outline": "- Compare payload flexibility\n- Network requests\n- Caching challenges",
        "follow_up_question": "How do you handle query depth limiting and rate limiting in GraphQL?"
    }

    with patch("app.routes.questions.llm_service.evaluate_answer", return_value=mock_eval):
        answer_res = client.post(f"/api/questions/{question_id}/answer", headers=auth_headers, json={
            "answer_text": "GraphQL allows clients to request exact fields, solving over-fetching, but caching is more complex than HTTP REST."
        })

    assert answer_res.status_code == 200
    answer_data = answer_res.get_json()
    assert answer_data["answer"]["correctness"] == 8.5
    assert answer_data["answer"]["average_score"] == 8.0
    assert answer_data["follow_up_question"] is not None
    assert answer_data["follow_up_question"]["is_follow_up"] is True
    assert "query depth" in answer_data["follow_up_question"]["text"]

def test_complete_interview_and_generate_report(client, auth_headers):
    # Create interview
    mock_questions = [{"text": "Explain CAP Theorem.", "category": "Distributed Systems"}]
    with patch("app.routes.interviews.llm_service.generate_questions", return_value=mock_questions):
        res = client.post("/api/interviews", headers=auth_headers, json={
            "role": "Backend",
            "difficulty": "Medium",
            "num_questions": 3
        })
    interview = res.get_json()["interview"]
    interview_id = interview["id"]
    question_id = interview["questions"][0]["id"]

    # Submit answer
    with patch("app.routes.questions.llm_service.evaluate_answer", return_value={
        "correctness": 9.0, "clarity": 8.5, "depth": 8.0,
        "feedback": "Accurate explanation of Consistency, Availability, Partition tolerance.",
        "ideal_outline": "- Definition of CAP\n- Real world examples (Kafka vs Cassandra)",
        "follow_up_question": None
    }):
        client.post(f"/api/questions/{question_id}/answer", headers=auth_headers, json={
            "answer_text": "CAP theorem states that a distributed system can deliver at most two of Consistency, Availability, and Partition Tolerance."
        })

    # Complete interview
    mock_report = {
        "overall_score": 85.0,
        "strengths": ["Strong foundational knowledge in distributed data storage", "Concise communication"],
        "weak_areas": ["Could explore edge case network partitions"],
        "improvement_plan": [
            "1. Deepen understanding of consensus algorithms (Raft/Paxos).",
            "2. Study conflict resolution in multi-master DB architectures.",
            "3. Practice system design back-of-the-envelope calculations.",
            "4. Review real-world postmortems of network partitions.",
            "5. Conduct mock interviews on distributed caching strategies."
        ]
    }

    with patch("app.routes.interviews.llm_service.generate_final_report", return_value=mock_report):
        complete_res = client.post(f"/api/interviews/{interview_id}/complete", headers=auth_headers)

    assert complete_res.status_code == 200
    report_data = complete_res.get_json()
    assert report_data["interview"]["status"] == "completed"
    assert report_data["interview"]["overall_score"] == 85.0
    assert len(report_data["report"]["improvement_plan"]) == 5

def test_dashboard_stats(client, auth_headers):
    stats_res = client.get("/api/dashboard/stats", headers=auth_headers)
    assert stats_res.status_code == 200
    data = stats_res.get_json()
    assert "total_interviews" in data
    assert "average_score" in data
    assert "score_history" in data
    assert "topic_breakdown" in data
