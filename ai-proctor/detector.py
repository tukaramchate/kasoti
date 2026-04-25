"""
detector.py — AI detection logic for the Kasoti proctoring service.

Responsibilities:
  - Count faces using MediaPipe FaceMesh
  - Detect mobile phones using YOLOv8n
  - Compare current face to a reference face (landmark-based)

Returns one of: OK | NO_FACE | MULTIPLE_PERSON | PHONE_DETECTED | FACE_MISMATCH
"""

import base64
import logging
import numpy as np
import cv2
import mediapipe as mp
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# ── MediaPipe setup ──────────────────────────────────────────────────────────
_mp_face_mesh = mp.solutions.face_mesh
_face_mesh = _mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=5,          # detect up to 5 so we can flag multiple persons
    refine_landmarks=False,
    min_detection_confidence=0.5,
)

# ── YOLOv8n setup (downloads weights on first run) ───────────────────────────
import torch
_original_load = torch.load
def _patched_load(*args, **kwargs):
    if 'weights_only' not in kwargs:
        kwargs['weights_only'] = False
    return _original_load(*args, **kwargs)
torch.load = _patched_load

_yolo = YOLO("yolov8n.pt")   # smallest / fastest model
PHONE_CLASS_ID = 67           # COCO class 67 = "cell phone"

# ── Face mismatch threshold ──────────────────────────────────────────────────
# Euclidean distance of normalized landmarks. Tune this if needed.
MISMATCH_THRESHOLD = 0.10


def _decode_image(b64_string: str) -> np.ndarray | None:
    """Decode a base64 string (with or without data-URI prefix) into a BGR Mat."""
    try:
        # Strip optional data URI prefix
        if "," in b64_string:
            b64_string = b64_string.split(",", 1)[1]
        img_bytes = base64.b64decode(b64_string)
        arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        logger.error("Image decode error: %s", e)
        return None


def _get_landmarks(img_bgr: np.ndarray) -> list[list]:
    """
    Run MediaPipe FaceMesh on the image.
    Returns a list of landmark arrays — one array per detected face.
    Each array has shape (468, 2) — normalised (x, y) coordinates.
    """
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    result = _face_mesh.process(img_rgb)
    if not result.multi_face_landmarks:
        return []
    faces = []
    for face_lm in result.multi_face_landmarks:
        pts = np.array([[lm.x, lm.y] for lm in face_lm.landmark], dtype=np.float32)
        faces.append(pts)
    return faces


def _landmark_distance(lm1: np.ndarray, lm2: np.ndarray) -> float:
    """
    Mean Euclidean distance between two sets of normalised landmarks.
    Lower = more similar.
    """
    return float(np.mean(np.linalg.norm(lm1 - lm2, axis=1)))


def _detect_phone(img_bgr: np.ndarray) -> bool:
    """Return True if a cell phone is detected by YOLOv8."""
    results = _yolo(img_bgr, verbose=False, conf=0.45)
    for r in results:
        if r.boxes is not None:
            classes = r.boxes.cls.cpu().numpy().astype(int).tolist()
            if PHONE_CLASS_ID in classes:
                return True
    return False


# ── Public API ────────────────────────────────────────────────────────────────

def analyze(frame_b64: str, reference_b64: str | None = None) -> dict:
    """
    Analyze a webcam frame and return a detection result.

    Args:
        frame_b64:     Base64-encoded current webcam frame.
        reference_b64: Base64-encoded reference face captured at exam start.
                       Pass None to skip face-match check.

    Returns:
        {
            "result": "OK" | "NO_FACE" | "MULTIPLE_PERSON"
                     | "PHONE_DETECTED" | "FACE_MISMATCH",
            "confidence": float   # 0.0–1.0 (rough proxy)
        }
    """
    frame = _decode_image(frame_b64)
    if frame is None:
        return {"result": "NO_FACE", "confidence": 0.0}

    # ── Step 1: Face count check ─────────────────────────────────────────────
    face_landmarks = _get_landmarks(frame)

    if len(face_landmarks) == 0:
        return {"result": "NO_FACE", "confidence": 0.95}

    if len(face_landmarks) >= 2:
        return {"result": "MULTIPLE_PERSON", "confidence": 0.90}

    # ── Step 2: Phone detection ──────────────────────────────────────────────
    if _detect_phone(frame):
        return {"result": "PHONE_DETECTED", "confidence": 0.85}

    # ── Step 3: Face mismatch (only if reference provided) ───────────────────
    if reference_b64:
        ref_img = _decode_image(reference_b64)
        if ref_img is not None:
            ref_landmarks = _get_landmarks(ref_img)
            if ref_landmarks:
                dist = _landmark_distance(face_landmarks[0], ref_landmarks[0])
                if dist > MISMATCH_THRESHOLD:
                    logger.info("Face mismatch distance=%.4f (threshold=%.4f)", dist, MISMATCH_THRESHOLD)
                    return {"result": "FACE_MISMATCH", "confidence": min(0.99, dist * 5)}

    return {"result": "OK", "confidence": 1.0}
