"""
app.py — Flask REST API for the Kasoti AI Proctoring microservice.

Endpoints:
  POST /detect   { image: <base64>, referenceImage: <base64|null> }
               → { result: "OK|NO_FACE|...", confidence: 0.0–1.0 }

  GET  /health  → { status: "UP" }

Run:
  python app.py
  (default port 5000)
"""

import logging
from flask import Flask, request, jsonify
from detector import analyze

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    """Liveness probe."""
    return jsonify({"status": "UP", "service": "kasoti-ai-proctor"})


@app.route("/detect", methods=["POST"])
def detect():
    """
    Analyze a webcam frame for proctoring violations.

    Request body (JSON):
      {
        "image":          "<base64-encoded current frame>",  # required
        "referenceImage": "<base64-encoded reference face>"  # optional
      }

    Response:
      {
        "result":     "OK" | "NO_FACE" | "MULTIPLE_PERSON"
                     | "PHONE_DETECTED" | "FACE_MISMATCH",
        "confidence": <float 0.0–1.0>
      }
    """
    body = request.get_json(silent=True)

    # ── Input validation ──────────────────────────────────────────────────────
    if not body or "image" not in body:
        return jsonify({"error": "Missing required field: image"}), 400

    frame_b64 = body.get("image", "")
    reference_b64 = body.get("referenceImage")   # may be None

    if not frame_b64:
        return jsonify({"error": "image field is empty"}), 400

    # ── Run AI detection ──────────────────────────────────────────────────────
    try:
        detection = analyze(frame_b64, reference_b64)
        logger.info("Detection result: %s (confidence=%.2f)", detection["result"], detection["confidence"])
        return jsonify(detection)
    except Exception as e:
        logger.exception("Unexpected error during detection")
        return jsonify({"error": "Internal detection error", "detail": str(e)}), 500


if __name__ == "__main__":
    # Note: Use gunicorn in production: gunicorn -w 2 app:app
    app.run(host="0.0.0.0", port=5000, debug=False)
