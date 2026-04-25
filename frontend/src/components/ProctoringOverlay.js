import React, { useEffect, useState } from "react";
import { FiAlertTriangle, FiAlertOctagon, FiXCircle } from "react-icons/fi";

/**
 * ProctoringOverlay — shows warning banners and the termination screen.
 *
 * Three tiers:
 *  Warning 1: yellow slide-in banner (non-blocking, auto-dismisses)
 *  Warning 2: red modal overlay with "final warning" message (requires dismiss)
 *  Warning 3 / terminated: full-screen red wall → exam auto-submitted externally
 *
 * Props:
 *  warningCount   — current warning count
 *  warningLimit   — max warnings before termination
 *  isTerminated   — boolean
 *  latestViolation — { type, message } | null
 *  onDismiss      — called when user clicks "Continue" on warning modals
 */

const VIOLATION_LABELS = {
  NO_FACE:          "No face detected in the camera",
  MULTIPLE_PERSON:  "Multiple persons detected",
  PHONE_DETECTED:   "Mobile phone detected",
  FACE_MISMATCH:    "Your face doesn't match the registered photo",
  TAB_SWITCH:       "Tab switching detected",
  FULLSCREEN_EXIT:  "Fullscreen mode exited",
};

const ProctoringOverlay = ({ warningCount, warningLimit, isTerminated, latestViolation, onDismiss }) => {
  const [showBanner, setShowBanner] = useState(false);

  // Show banner whenever a new violation arrives
  useEffect(() => {
    if (latestViolation && !isTerminated) {
      setShowBanner(true);
      // Warning 1 auto-dismisses after 4 seconds
      if (warningCount === 1) {
        const t = setTimeout(() => setShowBanner(false), 4000);
        return () => clearTimeout(t);
      }
    }
  }, [latestViolation, warningCount, isTerminated]);

  // ── Termination screen ─────────────────────────────────────────────────────
  if (isTerminated) {
    return (
      <div className="fixed inset-0 z-[9999] bg-red-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
        <FiXCircle size={72} className="text-red-300 mb-6" />
        <h1 className="text-4xl font-bold text-white mb-3">Exam Terminated</h1>
        <p className="text-red-200 text-lg mb-2">
          You have exceeded the maximum number of violations ({warningLimit}).
        </p>
        <p className="text-red-300 text-sm">
          Your answers have been automatically submitted. Please contact your instructor.
        </p>
      </div>
    );
  }

  // ── Warning 2: blocking red modal (final warning) ──────────────────────────
  if (showBanner && warningCount >= 2 && latestViolation) {
    return (
      <div className="fixed inset-0 z-[9000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[color:var(--bg-card)] border-2 border-[color:var(--danger)] rounded-2xl p-8 text-center shadow-2xl animate-[pulse_1s_ease-in-out_3]">
          <FiAlertOctagon size={52} className="text-[color:var(--danger)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[color:var(--danger)] mb-2">
            ⚠ Final Warning ({warningCount}/{warningLimit})
          </h2>
          <p className="text-[color:var(--text-primary)] font-medium mb-1">
            {VIOLATION_LABELS[latestViolation.type] || latestViolation.type}
          </p>
          <p className="text-[color:var(--text-secondary)] text-sm mb-6">
            One more violation will automatically terminate your exam.
          </p>
          <button
            onClick={() => { setShowBanner(false); onDismiss?.(); }}
            className="w-full py-3 bg-[color:var(--danger)] hover:bg-red-700 text-white rounded-xl font-semibold text-sm cursor-pointer transition-all"
          >
            I Understand — Continue Exam
          </button>
        </div>
      </div>
    );
  }

  // ── Warning 1: yellow slide-in banner (non-blocking) ─────────────────────
  if (showBanner && warningCount === 1 && latestViolation) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[8000] animate-[slideDown_0.3s_ease-out]">
        <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/80 border border-yellow-400 rounded-xl px-5 py-3.5 shadow-lg max-w-sm">
          <FiAlertTriangle size={22} className="text-yellow-600 shrink-0" />
          <div>
            <p className="text-yellow-800 dark:text-yellow-200 font-semibold text-sm">
              Warning {warningCount}/{warningLimit}
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 text-xs">
              {VIOLATION_LABELS[latestViolation.type] || latestViolation.type}
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-auto text-yellow-600 hover:text-yellow-800 text-lg font-bold"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ProctoringOverlay;
