import os
import re
import json
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class LLMService:
    """
    Centralized LLM service provider using Google Gemini API via official google-genai SDK.
    All LLM logic is isolated here so the underlying model or provider can be swapped easily.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "").strip()
        self.model_name = model or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self._client = None

        if self._is_api_key_valid():
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"Gemini client initialized with model: {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize google-genai client: {e}. Fallback provider will be used.")
                self._client = None
        else:
            logger.info("No valid GEMINI_API_KEY detected. Dynamic mock fallback provider will be used.")

    def _is_api_key_valid(self) -> bool:
        return bool(self.api_key and self.api_key != "your_gemini_api_key_here" and len(self.api_key) > 10)

    def _clean_and_parse_json(self, raw_text: str) -> Any:
        """Strip markdown code fence blocks and safely parse JSON."""
        cleaned = raw_text.strip()
        # Remove ```json ... ``` or ``` ... ```
        if "```" in cleaned:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
            if match:
                cleaned = match.group(1).strip()

        # In case there is text before/after JSON array or object
        if not (cleaned.startswith("{") or cleaned.startswith("[")):
            match_obj = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", cleaned)
            if match_obj:
                cleaned = match_obj.group(1).strip()

        return json.loads(cleaned)

    def _call_gemini_with_retry(self, prompt: str, system_instruction: str, max_retries: int = 2) -> str:
        """Call Gemini API with retry logic and application/json config."""
        from google.genai import types

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.4,
            response_mime_type="application/json"
        )

        last_error = None
        current_prompt = prompt

        for attempt in range(max_retries + 1):
            try:
                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents=current_prompt,
                    config=config
                )
                if response and response.text:
                    return response.text
                raise ValueError("Empty response received from Gemini API")
            except Exception as e:
                last_error = e
                logger.warning(f"Gemini call attempt {attempt + 1} failed: {e}")
                if attempt < max_retries:
                    current_prompt = f"{prompt}\n\nNote: Please ensure the response is strictly valid, well-formed JSON matching the required schema exactly without markdown formatting."

        raise RuntimeError(f"Gemini API invocation failed after {max_retries + 1} attempts: {last_error}")

    def generate_questions(self, role: str, difficulty: str, count: int = 5) -> List[Dict[str, str]]:
        """
        Generates technical interview questions tailored to the candidate's chosen role and difficulty.
        Returns a list of dicts: [{"text": str, "category": str}]
        """
        count = max(3, min(count, 10))

        if not self._client or not self._is_api_key_valid():
            return self._mock_generate_questions(role, difficulty, count)

        system_instruction = (
            "You are an expert technical interviewer at a top technology company. "
            "You generate rigorous, realistic, role-specific technical interview questions. "
            "You must return ONLY a JSON array of question objects."
        )

        prompt = f"""
Generate {count} unique, realistic technical interview questions for a {difficulty} level {role} role.

Format requirements:
- Return ONLY a JSON array.
- Each item must have:
  - "text": The exact interview question asking for system design, coding concept, architecture, problem-solving, or tradeoffs.
  - "category": A specific technical subtopic (e.g., 'System Architecture', 'Database Optimization', 'State Management', 'Model Evaluation', 'Concurrency').

Example format:
[
  {{"text": "Explain the difference between optimistic and pessimistic locking with a real-world use case.", "category": "Databases"}},
  {{"text": "How would you design an idempotent payment processing API?", "category": "System Design"}}
]
"""

        for attempt in range(2):
            try:
                raw_json = self._call_gemini_with_retry(prompt, system_instruction)
                data = self._clean_and_parse_json(raw_json)

                if isinstance(data, list) and len(data) > 0:
                    validated = []
                    for item in data[:count]:
                        if isinstance(item, dict) and "text" in item:
                            validated.append({
                                "text": str(item["text"]).strip(),
                                "category": str(item.get("category", "General")).strip()
                            })
                    if len(validated) >= min(3, count):
                        return validated

                # If schema did not match, retry
                prompt += "\nError: The previous response did not return a valid JSON list of objects with 'text' and 'category'. Try again."
            except Exception as e:
                logger.warning(f"Question generation attempt {attempt + 1} parsing error: {e}")

        # Fallback if LLM parsing failed after retries
        return self._mock_generate_questions(role, difficulty, count)

    def evaluate_answer(
        self,
        question_text: str,
        answer_text: str,
        role: str,
        difficulty: str,
        is_follow_up: bool = False
    ) -> Dict[str, Any]:
        """
        Evaluates a candidate's answer to a technical question.
        Returns:
        {
            "correctness": float (0.0 to 10.0),
            "clarity": float (0.0 to 10.0),
            "depth": float (0.0 to 10.0),
            "feedback": str,
            "ideal_outline": str,
            "follow_up_question": Optional[str]
        }
        """
        if not self._client or not self._is_api_key_valid():
            return self._mock_evaluate_answer(question_text, answer_text, role, difficulty, is_follow_up)

        system_instruction = (
            "You are a principal engineer conducting a technical interview evaluation. "
            "Be fair, thorough, and constructive. Score strictly between 0.0 and 10.0. "
            "You must return ONLY a JSON object."
        )

        follow_up_instruction = (
            "Because this is an initial question, assess if asking 1 adaptive follow-up question is valuable. "
            "If the answer could be probed deeper or has an interesting edge case, set 'follow_up_question' to a single sharp question string. "
            "If the answer is comprehensive or already complete, set 'follow_up_question' to null."
            if not is_follow_up else
            "This is already a follow-up question. Set 'follow_up_question' to null."
        )

        prompt = f"""
Evaluate the following interview response for a {difficulty} level {role} candidate.

Question:
{question_text}

Candidate's Answer:
{answer_text}

{follow_up_instruction}

Return a JSON object with this exact structure:
{{
  "correctness": <float 0.0-10.0>,
  "clarity": <float 0.0-10.0>,
  "depth": <float 0.0-10.0>,
  "feedback": "<2-4 sentences explaining what was correct, any inaccuracies, and key omissions>",
  "ideal_outline": "<A concise 3-5 bullet point outline of what a senior-level answer should cover>",
  "follow_up_question": <string or null>
}}
"""

        for attempt in range(2):
            try:
                raw_json = self._call_gemini_with_retry(prompt, system_instruction)
                data = self._clean_and_parse_json(raw_json)

                if isinstance(data, dict):
                    correctness = float(min(10.0, max(0.0, float(data.get("correctness", 6.0)))))
                    clarity = float(min(10.0, max(0.0, float(data.get("clarity", 6.0)))))
                    depth = float(min(10.0, max(0.0, float(data.get("depth", 6.0)))))
                    feedback = str(data.get("feedback", "Good effort, but could provide more concrete technical specifics.")).strip()
                    ideal_outline = str(data.get("ideal_outline", "- Core definition\n- Key tradeoffs\n- Production best practices")).strip()
                    follow_up = data.get("follow_up_question")
                    if follow_up and isinstance(follow_up, str) and not is_follow_up:
                        follow_up = follow_up.strip()
                    else:
                        follow_up = None

                    return {
                        "correctness": round(correctness, 1),
                        "clarity": round(clarity, 1),
                        "depth": round(depth, 1),
                        "feedback": feedback,
                        "ideal_outline": ideal_outline,
                        "follow_up_question": follow_up
                    }
            except Exception as e:
                logger.warning(f"Answer evaluation attempt {attempt + 1} parsing error: {e}")

        return self._mock_evaluate_answer(question_text, answer_text, role, difficulty, is_follow_up)

    def generate_final_report(
        self,
        role: str,
        difficulty: str,
        questions_and_answers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Synthesizes all questions and answers into an overall report:
        {
            "overall_score": float (0-100),
            "strengths": list[str],
            "weak_areas": list[str],
            "improvement_plan": list[str] (5 points)
        }
        """
        if not self._client or not self._is_api_key_valid():
            return self._mock_final_report(role, difficulty, questions_and_answers)

        system_instruction = (
            "You are a technical hiring manager creating a comprehensive post-interview feedback report. "
            "You return ONLY a JSON object."
        )

        qa_summary = []
        for i, qa in enumerate(questions_and_answers, start=1):
            q_text = qa.get("question_text", "")
            a_text = qa.get("answer_text", "")
            scores = qa.get("scores", {})
            qa_summary.append(
                f"Q{i} ({qa.get('category', 'Topic')}): {q_text}\n"
                f"Answer: {a_text}\n"
                f"Scores: Correctness={scores.get('correctness')}, Clarity={scores.get('clarity')}, Depth={scores.get('depth')}"
            )

        qa_block = "\n---\n".join(qa_summary)

        prompt = f"""
Candidate Role: {role}
Difficulty Level: {difficulty}

Candidate's Performance Across Questions:
{qa_block}

Task:
Analyze their performance and return a structured JSON report with:
1. "overall_score": A number between 0 and 100 reflecting holistic performance across all criteria.
2. "strengths": Array of 3-4 distinct strengths demonstrated by the candidate.
3. "weak_areas": Array of 2-3 specific technical gaps or areas needing improvement.
4. "improvement_plan": Array of EXACTLY 5 actionable, prioritized study and practice recommendations.

Format:
{{
  "overall_score": 82.5,
  "strengths": ["...", "...", "..."],
  "weak_areas": ["...", "..."],
  "improvement_plan": [
    "1. ...",
    "2. ...",
    "3. ...",
    "4. ...",
    "5. ..."
  ]
}}
"""

        for attempt in range(2):
            try:
                raw_json = self._call_gemini_with_retry(prompt, system_instruction)
                data = self._clean_and_parse_json(raw_json)

                if isinstance(data, dict):
                    overall_score = float(min(100.0, max(0.0, float(data.get("overall_score", 70.0)))))
                    strengths = data.get("strengths", ["Solid foundational knowledge", "Clear communication style"])
                    weak_areas = data.get("weak_areas", ["Could explain edge cases in deeper detail", "System scaling nuances"])
                    improvement_plan = data.get("improvement_plan", [])

                    # Ensure 5 points in improvement plan
                    if not isinstance(improvement_plan, list) or len(improvement_plan) < 5:
                        default_points = [
                            "Review distributed systems concepts including data consistency models and consensus.",
                            "Practice explaining technical trade-offs between latency and throughput in system design.",
                            "Deepen understanding of database indexing strategies and query execution plans.",
                            "Implement end-to-end caching architectures using Redis and cache invalidation policies.",
                            "Perform timed mock interviews focusing on concise, structured architectural answers."
                        ]
                        improvement_plan = (improvement_plan if isinstance(improvement_plan, list) else []) + default_points
                        improvement_plan = improvement_plan[:5]

                    return {
                        "overall_score": round(overall_score, 1),
                        "strengths": strengths[:4],
                        "weak_areas": weak_areas[:3],
                        "improvement_plan": improvement_plan[:5]
                    }
            except Exception as e:
                logger.warning(f"Final report attempt {attempt + 1} parsing error: {e}")

        return self._mock_final_report(role, difficulty, questions_and_answers)

    # ================= MOCK FALLBACK IMPLEMENTATIONS =================

    def _mock_generate_questions(self, role: str, difficulty: str, count: int) -> List[Dict[str, str]]:
        bank = {
            "Full Stack": [
                {"text": "Explain how the Virtual DOM works in React and how reconciliation optimizes DOM updates.", "category": "Frontend Architecture"},
                {"text": "How do you implement secure user authentication using JWT and refresh tokens across a SPA and REST API?", "category": "Security & Auth"},
                {"text": "Describe the differences between SSR, SSG, and CSR. When would you choose each for a high-traffic e-commerce platform?", "category": "Web Performance"},
                {"text": "How would you design a scalable real-time notification service using WebSockets and Redis Pub/Sub?", "category": "System Design"},
                {"text": "What are database indexes, how do B-Trees work under the hood, and when can indexing hurt performance?", "category": "Databases"},
                {"text": "Explain Cross-Origin Resource Sharing (CORS), preflight OPTIONS requests, and how to configure them safely in production.", "category": "Networking & APIs"},
                {"text": "How would you structure a CI/CD pipeline with automated testing, linting, and zero-downtime deployment?", "category": "DevOps & CI/CD"}
            ],
            "Backend": [
                {"text": "Explain the differences between SQL and NoSQL databases. In what scenarios would you choose DynamoDB or MongoDB over PostgreSQL?", "category": "Database Architecture"},
                {"text": "How do you handle race conditions and ensure idempotency in a distributed payment processing system?", "category": "Concurrency & Distributed Systems"},
                {"text": "Explain the CAP theorem and discuss the trade-offs made by Apache Kafka and Cassandra.", "category": "Distributed Systems"},
                {"text": "How does database connection pooling work, and how do you calculate optimal pool size for high concurrency?", "category": "Database Optimization"},
                {"text": "Describe the implementation of a rate limiting algorithm (e.g., Token Bucket or Leaky Bucket) in an API gateway.", "category": "System Design"},
                {"text": "How do you design a database schema for an e-commerce order management system with ACID guarantees?", "category": "Data Modeling"},
                {"text": "Explain gRPC vs REST. When would you prefer Protocol Buffers over JSON in microservices communication?", "category": "API Protocols"}
            ],
            "Data/ML": [
                {"text": "Explain the bias-variance tradeoff and how regularization (L1 vs L2) impacts model generalization.", "category": "Machine Learning Fundamentals"},
                {"text": "How would you detect and handle data drift and concept drift in a deployed production ML model?", "category": "MLOps & Monitoring"},
                {"text": "Describe the self-attention mechanism in Transformers and how multi-head attention computes representations.", "category": "Deep Learning & NLP"},
                {"text": "How do you optimize an inference pipeline for a Large Language Model to reduce latency and memory usage?", "category": "LLM Engineering"},
                {"text": "Explain how Gradient Boosting (XGBoost/LightGBM) works compared to Random Forests.", "category": "Ensemble Methods"},
                {"text": "Design a real-time recommendation feature store and inference architecture for millions of daily active users.", "category": "System Design"},
                {"text": "What metrics would you use to evaluate an imbalanced binary classification dataset, and why is accuracy misleading?", "category": "Model Evaluation"}
            ]
        }

        selected_bank = bank.get(role, bank["Full Stack"])
        # Adjust questions based on count
        questions = selected_bank[:count]
        if len(questions) < count:
            while len(questions) < count:
                idx = len(questions) + 1
                questions.append({
                    "text": f"Explain key design patterns and failure recovery mechanisms for a {difficulty.lower()} {role} service.",
                    "category": "Architecture"
                })
        return questions

    def _mock_evaluate_answer(
        self,
        question_text: str,
        answer_text: str,
        role: str,
        difficulty: str,
        is_follow_up: bool
    ) -> Dict[str, Any]:
        word_count = len(answer_text.split())
        
        # Heuristic scoring for offline/mock fallback
        base = 7.0
        if word_count < 20:
            base = 4.0
            clarity = 5.0
            depth = 3.5
            feedback = "The answer is too brief and lacks essential technical depth and concrete examples."
        elif word_count < 50:
            base = 6.5
            clarity = 7.0
            depth = 5.5
            feedback = "Good fundamental understanding shown, but missing discussion of production trade-offs and edge cases."
        else:
            base = 8.5
            clarity = 8.5
            depth = 8.0
            feedback = "Strong and well-structured response! Clearly articulated key concepts with practical context."

        correctness = min(9.5, max(3.0, base + 0.2))
        clarity = min(9.5, max(3.0, clarity if 'clarity' in locals() else base))
        depth = min(9.5, max(3.0, depth if 'depth' in locals() else base - 0.5))

        ideal_outline = (
            "- Clearly define the foundational principles and core mechanisms.\n"
            "- Explain key tradeoffs (performance, memory, consistency vs availability).\n"
            "- Provide a concrete production scenario or code pattern.\n"
            "- Mention failure modes, monitoring, and security considerations."
        )

        follow_up = None
        if not is_follow_up and word_count >= 15:
            follow_up = f"How would your proposed solution behave if traffic spiked 10x or if a downstream network partition occurred?"

        return {
            "correctness": round(correctness, 1),
            "clarity": round(clarity, 1),
            "depth": round(depth, 1),
            "feedback": feedback,
            "ideal_outline": ideal_outline,
            "follow_up_question": follow_up
        }

    def _mock_final_report(
        self,
        role: str,
        difficulty: str,
        questions_and_answers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        total_score = 0.0
        count = 0
        for qa in questions_and_answers:
            scores = qa.get("scores", {})
            avg = (scores.get("correctness", 7.0) + scores.get("clarity", 7.0) + scores.get("depth", 7.0)) / 3.0
            total_score += avg
            count += 1

        overall_score = round((total_score / max(1, count)) * 10.0, 1) if count > 0 else 75.0

        strengths = [
            f"Solid conceptual understanding of {role} fundamentals.",
            "Structured and logical thought process during technical explanations.",
            "Demonstrated awareness of real-world operational challenges."
        ]
        weak_areas = [
            "Deeper exploration of edge cases and distributed failure modes.",
            "Quantitative justifications when discussing performance tradeoffs."
        ]
        improvement_plan = [
            f"1. Deepen domain knowledge in {role} architecture patterns and trade-offs.",
            "2. Practice system design problems focusing on quantitative estimation (QPS, storage, latency).",
            "3. Study database isolation levels, lock contention, and index internals.",
            "4. Structure answers using the STAR/CAR framework (Context, Action, Result) with clear technical metrics.",
            "5. Schedule weekly mock interviews with strict 3-minute timers per question to sharpen conciseness."
        ]

        return {
            "overall_score": overall_score,
            "strengths": strengths,
            "weak_areas": weak_areas,
            "improvement_plan": improvement_plan
        }

# Singleton instance
llm_service = LLMService()
