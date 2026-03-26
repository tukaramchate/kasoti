import React, { useState, useEffect, useCallback } from "react";
import useFullScreen from "../hooks/useFullScreen";
import { FiMaximize, FiAlertTriangle } from "react-icons/fi";

const MAX_VIOLATIONS = 3;

/**
 * FullScreenGuard wraps quiz content and enforces full-screen mode.
 *
 * Props:
 *  - enabled: boolean — whether full-screen is required for this quiz
 *  - onAutoSubmit: () => void — called when violation limit is reached
 *  - children: React.ReactNode — the quiz UI
 */
const FullScreenGuard = ({ enabled, onAutoSubmit, children }) => {
  const { isFullScreen, enterFullScreen, isSupported } = useFullScreen();
  const [violations, setViolations] = useState(0);
  const [hasEnteredOnce, setHasEnteredOnce] = useState(false);
  const [showUnsupportedWarning, setShowUnsupportedWarning] = useState(false);

  // Track when user exits full screen after having entered
  useEffect(() => {
    if (!enabled || !hasEnteredOnce) return;
    if (!isFullScreen) {
      setViolations((prev) => {
        const next = prev + 1;
        if (next >= MAX_VIOLATIONS && onAutoSubmit) {
          onAutoSubmit();
        }
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullScreen]);

  // Cleanup: exit full screen when component unmounts (quiz submitted/navigated away)
  useEffect(() => {
    return () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    };
  }, []);

  const handleEnterFullScreen = useCallback(async () => {
    if (!isSupported) {
      setShowUnsupportedWarning(true);
      setHasEnteredOnce(true);
      return;
    }
    await enterFullScreen();
    setHasEnteredOnce(true);
  }, [enterFullScreen, isSupported]);

  const handleReEnterFullScreen = useCallback(async () => {
    await enterFullScreen();
  }, [enterFullScreen]);

  // ─── If not enabled, just render children ───
  if (!enabled) return <>{children}</>;

  // ─── Gate: Must enter full screen first ───
  if (!hasEnteredOnce) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[color:var(--accent-light)] flex items-center justify-center">
            <FiMaximize className="text-[color:var(--accent)]" size={28} />
          </div>
          <h2 className="text-xl font-bold text-[color:var(--text-primary)] mb-2">
            Full Screen Required
          </h2>
          <p className="text-sm text-[color:var(--text-secondary)] mb-2 leading-relaxed">
            This quiz must be taken in full-screen mode to ensure a fair testing environment.
          </p>
          <p className="text-xs text-[color:var(--text-muted)] mb-6">
            Exiting full screen during the quiz will count as a violation.
            After {MAX_VIOLATIONS} violations, your quiz will be auto-submitted.
          </p>
          <button
            onClick={handleEnterFullScreen}
            className="w-full py-3 bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white rounded-xl font-semibold text-sm cursor-pointer transition-all hover:shadow-glow hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <FiMaximize size={16} />
            Enter Full Screen & Start Quiz
          </button>
          {showUnsupportedWarning && (
            <p className="mt-4 text-xs text-[color:var(--warning)] flex items-center gap-1 justify-center">
              <FiAlertTriangle /> Full screen not supported on this browser. Proceeding without it.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── Warning overlay when user exits full screen ───
  if (!isFullScreen && isSupported && violations < MAX_VIOLATIONS) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-primary)] relative">
        {/* Blurred quiz content behind */}
        <div className="filter blur-md pointer-events-none opacity-40">
          {children}
        </div>

        {/* Overlay */}
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[color:var(--bg-card)] border border-[color:var(--danger)] rounded-2xl p-8 text-center shadow-2xl">
            <button
              onClick={handleReEnterFullScreen}
              className="w-full py-3 bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white rounded-xl font-semibold text-sm cursor-pointer transition-all hover:shadow-glow hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <FiMaximize size={16} />
              Return to Full Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Normal: in full screen or unsupported browser (graceful fallback) ───
  return <>{children}</>;
};

export default FullScreenGuard;
