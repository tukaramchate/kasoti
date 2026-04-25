"""
detector.py — AI detection logic for the Kasoti proctoring service.

Checks (in order):
  1. NO_FACE         — no face detected by MediaPipe FaceMesh
  2. MULTIPLE_PERSON — more than one face detected
  3. PHONE_DETECTED  — mobile phone seen by YOLOv8n
  4. FACE_MISMATCH   — landmark distance vs reference > threshold
  5. OK              — all checks passed
"""

import base64
import logging
import numpy as np
import cv2

logger = logging.getLogger(__name__)

# ── MediaPipe FaceMesh ────────────────────────────────────────────────────────
import mediapipe as mp

_face_mesh = mp.solutions.face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=5,
    refine_landmarks=False,
    min_detection_confidence=0.5,
)

# ── YOLOv8n (phone detection) — lazy-loaded so startup is fast ───────────────
_yolo = None
PHONE_CLASS_ID = 67   # COCO class 67 = "cell phone"

def _get_yolo():
    """Lazy-load YOLO model (downloads weights on first call)."""
    global _yolo
    if _yolo is None:
        try:
            from ultralytics import YOLO
            _yolo = YOLO("yolov8n.pt")
            logger.info("YOLOv8n model loaded")
        except Exception as e:
            logger.warning("Could not load YOLOv8n — phone detection disabled: %s", e)
    return _yolo

# ── Face mismatch threshold ───────────────────────────────────────────────────
MISMATCH_THRESHOLD = 0.10


# ── Helpers ───────────────────────────────────────────────────────────────────

def _decode_image(b64_string: str):
    """Decode a base64 string (with or without data-URI prefix) → BGR Mat."""
    try:
        if "," in b64_string:
            b64_string = b64_string.split(",", 1)[1]
        img_bytes = base64.b64decode(b64_string)
        arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        logger.error("Image decode error: %s", e)
        return None


def _get_landmarks(img_bgr: np.ndarray) -> list:
    """
    Run MediaPipe FaceMesh. Returns list of (N,2) float32 arrays —
    one per detected face, each with 468 normalised (x, y) landmarks.
    """
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    result = _face_mesh.process(img_rgb)
    if not result.multi_face_landmarks:
        return []
    return [
        np.array([[lm.x, lm.y] for lm in face.landmark], dtype=np.float32)
        for face in result.multi_face_landmarks
    ]


def _landmark_distance(lm1: np.ndarray, lm2: np.ndarray) -> float:
    """Mean Euclidean distance between two normalised landmark sets."""
    return float(np.mean(np.linalg.norm(lm1 - lm2, axis=1)))


def _detect_phone(img_bgr: np.ndarray) -> bool:
    """Return True if a cell phone is detected by YOLOv8 (graceful skip if unavailable)."""
    yolo = _get_yolo()
    if yolo is None:
        return False
    try:
        results = yolo(img_bgr, verbose=False, conf=0.45)
        for r in results:
            if r.boxes is not None:
                classes = r.boxes.cls.cpu().numpy().astype(int).tolist()
                if PHONE_CLASS_ID in classes:
                    return True
    except Exception as e:
        logger.warning("YOLO inference error: %s", e)
    return False


# ── Public API ────────────────────────────────────────────────────────────────

def analyze(frame_b64: str, reference_b64: str = None) -> dict:
    """
    Analyze a webcam frame and return detection result.

    Args:
        frame_b64:     Base64-encoded current webcam frame (required).
        reference_b64: Base64-encoded reference face from exam start (optional).

    Returns:
        { "result": "OK"|"NO_FACE"|"MULTIPLE_PERSON"|"PHONE_DETECTED"|"FACE_MISMATCH",
          "confidence": float }
    """
    frame = _decode_image(frame_b64)
    if frame is None:
        return {"result": "NO_FACE", "confidence": 0.0}

    # Step 1 — Face count
    faces = _get_landmarks(frame)
    if len(faces) == 0:
        return {"result": "NO_FACE", "confidence": 0.95}
    if len(faces) >= 2:
        return {"result": "MULTIPLE_PERSON", "confidence": 0.90}

    # Step 2 — Phone detection
    if _detect_phone(frame):
        return {"result": "PHONE_DETECTED", "confidence": 0.85}

    # Step 3 — Face mismatch
    if reference_b64:
        ref_img = _decode_image(reference_b64)
        if ref_img is not None:
            ref_faces = _get_landmarks(ref_img)
            if ref_faces:
                dist = _landmark_distance(faces[0], ref_faces[0])
                if dist > MISMATCH_THRESHOLD:
                    logger.info("Face mismatch dist=%.4f threshold=%.4f", dist, MISMATCH_THRESHOLD)
                    return {"result": "FACE_MISMATCH", "confidence": min(0.99, dist * 5)}

    return {"result": "OK", "confidence": 1.0}
