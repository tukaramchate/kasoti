import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api";

const CAPTURE_INTERVAL_MS = 5000; // 5 seconds per user requirement

/**
 * useProctoring — manages the full proctoring lifecycle for a quiz attempt.
 *
 * Usage:
 *   const { warningCount, warningLimit, isTerminated, latestViolation,
 *           videoRef, startProctoring, stopProctoring, reportClientViolation } = useProctoring();
 *
 * 1. Call startProctoring(quizId) to capture reference face and begin monitoring.
 * 2. Attach videoRef to a <video> element to display the webcam feed.
 * 3. reportClientViolation(quizId, type) to log tab-switch / fullscreen-exit.
 * 4. Call stopProctoring(quizId) when the quiz is submitted.
 */
const useProctoring = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const canvasRef = useRef(document.createElement("canvas")); // off-screen canvas

  const [warningCount, setWarningCount] = useState(0);
  const [warningLimit, setWarningLimit] = useState(3);
  const [isTerminated, setIsTerminated] = useState(false);
  const [latestViolation, setLatestViolation] = useState(null); // { type, message }
  const [isActive, setIsActive] = useState(false);

  // ── Camera helpers ──────────────────────────────────────────────────────────

  /** Request webcam access and attach stream to videoRef. */
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      return true;
    } catch (err) {
      console.warn("[Proctor] Camera access denied:", err.message);
      return false;
    }
  }, []);

  /** Capture current video frame as Base64 JPEG string. */
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Return raw base64 (strip data URI prefix)
    return canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
  }, []);

  /** Stop all camera tracks and clear interval. */
  const teardown = useCallback(() => {
    clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  // ── API calls ───────────────────────────────────────────────────────────────

  const handleResult = useCallback((data) => {
    if (!data) return;
    setWarningCount(data.warningCount ?? 0);
    setWarningLimit(data.warningLimit ?? 3);
    if (data.terminated || data.status === "EXAM_TERMINATED") {
      setIsTerminated(true);
      teardown();
    } else if (data.status && data.status !== "OK") {
      setLatestViolation({ type: data.status, message: data.message });
    } else {
      setLatestViolation(null);
    }
  }, [teardown]);

  const analyzeFrame = useCallback(async (quizId, imageBase64, clientViolationType = null) => {
    try {
      const payload = { quizId, imageBase64: imageBase64 || "" };
      if (clientViolationType) payload.clientViolationType = clientViolationType;
      const res = await api.post("/api/proctoring/analyze", payload);
      handleResult(res.data);
    } catch (err) {
      console.error("[Proctor] analyze error:", err.message);
    }
  }, [handleResult]);

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Start proctoring for the given quizId.
   * Captures a reference face frame, registers it, then begins periodic monitoring.
   */
  const startProctoring = useCallback(async (quizId) => {
    const cameraOk = await initCamera();
    if (!cameraOk) {
      console.warn("[Proctor] No camera — proctoring skipped");
      return;
    }

    // Give video element 1s to render first frame
    await new Promise((r) => setTimeout(r, 1000));

    const refFrame = captureFrame();
    if (!refFrame) {
      console.warn("[Proctor] Could not capture reference frame");
      return;
    }

    try {
      await api.post("/api/proctoring/start", {
        quizId,
        referenceImageBase64: refFrame,
      });
    } catch (err) {
      console.error("[Proctor] start session error:", err.message);
    }

    setIsActive(true);

    // Start periodic frame capture every 5 seconds
    intervalRef.current = setInterval(async () => {
      const frame = captureFrame();
      if (frame) await analyzeFrame(quizId, frame);
    }, CAPTURE_INTERVAL_MS);
  }, [initCamera, captureFrame, analyzeFrame]);

  /**
   * Call when student submits the exam to clean up and end the session.
   */
  const stopProctoring = useCallback(async (quizId) => {
    teardown();
    try {
      await api.post(`/api/proctoring/end?quizId=${quizId}`);
    } catch (err) {
      // Non-critical — exam already submitted
      console.warn("[Proctor] end session error:", err.message);
    }
  }, [teardown]);

  /**
   * Report a client-side violation (TAB_SWITCH, FULLSCREEN_EXIT) immediately
   * without waiting for the next 5s capture cycle.
   */
  const reportClientViolation = useCallback(async (quizId, type) => {
    const frame = captureFrame() || "";
    await analyzeFrame(quizId, frame, type);
  }, [captureFrame, analyzeFrame]);

  // ── Tab-switch detection ────────────────────────────────────────────────────
  // NOTE: quizId is captured via closure when startProctoring is called.
  // Tab-switch reporting is wired in QuizData.js where quizId is in scope.

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => () => teardown(), [teardown]);

  return {
    videoRef,
    warningCount,
    warningLimit,
    isTerminated,
    latestViolation,
    isActive,
    startProctoring,
    stopProctoring,
    reportClientViolation,
  };
};

export default useProctoring;
