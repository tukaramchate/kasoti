import React from "react";

/**
 * WebcamPreview — small live camera thumbnail shown during a proctored exam.
 *
 * Props:
 *  videoRef      — ref attached to the hidden <video> element in useProctoring
 *  warningCount  — current warning count (drives border colour)
 *  isTerminated  — whether the exam has been terminated
 *  isActive      — whether proctoring is running
 */
const WebcamPreview = ({ videoRef, warningCount, warningLimit, isTerminated, isActive }) => {
  if (!isActive) return null;

  // Border colour: green → yellow → red
  const borderClass = isTerminated
    ? "border-[color:var(--danger)]"
    : warningCount >= warningLimit - 1
    ? "border-yellow-400"
    : "border-[color:var(--success)]";

  return (
    <div
      className={`fixed bottom-4 right-4 z-[500] rounded-xl overflow-hidden border-2 shadow-lg ${borderClass} transition-colors duration-500`}
      style={{ width: 120, height: 90 }}
      title="Proctoring Camera"
    >
      {/* Live webcam feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover scale-x-[-1]" /* mirror */
      />

      {/* Status dot */}
      <div className="absolute top-1 left-1 flex items-center gap-1">
        <span
          className={`w-2 h-2 rounded-full ${
            isTerminated
              ? "bg-[color:var(--danger)]"
              : "bg-[color:var(--success)] animate-pulse"
          }`}
        />
        <span className="text-white text-[9px] font-semibold drop-shadow">
          {isTerminated ? "OFF" : "LIVE"}
        </span>
      </div>

      {/* Warning badge */}
      {warningCount > 0 && !isTerminated && (
        <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1 py-0.5">
          <span className="text-yellow-300 text-[9px] font-bold">
            ⚠ {warningCount}/{warningLimit}
          </span>
        </div>
      )}
    </div>
  );
};

export default WebcamPreview;
