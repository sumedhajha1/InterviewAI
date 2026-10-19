import time
from collections import defaultdict
from functools import wraps
from flask import request, jsonify, g

# Simple in-memory rate limiter per key (user_id or remote_addr)
_request_records = defaultdict(list)

def rate_limit(limit: int = 20, per_seconds: int = 60):
    """
    In-memory rate limiting decorator.
    limit: max requests allowed within per_seconds window.
    per_seconds: duration of the window in seconds.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Identify key by user id if authenticated, else IP address
            key = getattr(g, "current_user", None)
            identifier = f"user_{key.id}" if key else f"ip_{request.remote_addr or 'unknown'}"
            endpoint_key = f"{identifier}:{request.endpoint}"
            
            now = time.time()
            cutoff = now - per_seconds
            
            # Prune old timestamps
            timestamps = [t for t in _request_records[endpoint_key] if t > cutoff]
            
            if len(timestamps) >= limit:
                retry_after = int(per_seconds - (now - timestamps[0]))
                return jsonify({
                    "error": "Rate limit exceeded. Please wait a moment before sending more requests.",
                    "code": "RATE_LIMIT_EXCEEDED",
                    "retry_after_seconds": max(1, retry_after)
                }), 429
            
            timestamps.append(now)
            _request_records[endpoint_key] = timestamps
            return f(*args, **kwargs)
        return wrapper
    return decorator
