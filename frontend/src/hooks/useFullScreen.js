import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook to manage the browser Fullscreen API.
 *
 * Returns:
 *  - isFullScreen: boolean — whether the document is currently in full-screen
 *  - enterFullScreen: () => Promise<void> — request full-screen (must be called from user gesture)
 *  - exitFullScreen: () => Promise<void> — exit full-screen
 *  - isSupported: boolean — whether the Fullscreen API is available in this browser
 */
const useFullScreen = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const elementRef = useRef(document.documentElement);

  const isSupported =
    typeof document !== "undefined" &&
    !!(
      document.documentElement.requestFullscreen ||
      document.documentElement.webkitRequestFullscreen ||
      document.documentElement.msRequestFullscreen
    );

  const getFullscreenElement = useCallback(() => {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );
  }, []);

  const enterFullScreen = useCallback(async () => {
    const el = elementRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Failed to enter fullscreen:", err);
    }
  }, []);

  const exitFullScreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (err) {
      console.warn("Failed to exit fullscreen:", err);
    }
  }, []);

  useEffect(() => {
    const handleChange = () => {
      setIsFullScreen(!!getFullscreenElement());
    };

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    document.addEventListener("MSFullscreenChange", handleChange);

    // Sync initial state
    handleChange();

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
      document.removeEventListener("MSFullscreenChange", handleChange);
    };
  }, [getFullscreenElement]);

  return { isFullScreen, enterFullScreen, exitFullScreen, isSupported };
};

export default useFullScreen;
