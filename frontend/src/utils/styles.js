// ─── Shared style constants ───────────────────────────────────────────────────
export const inputStyles =
    "w-full py-[11px] px-[14px] font-sans text-sm text-[color:var(--text-primary)] bg-[color:var(--bg-input)] border border-[color:var(--border)] rounded-xl outline-none transition-all duration-200 focus:border-[color:var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-light)] placeholder:text-[color:var(--text-muted)]";

export const primaryButtonStyles =
    "w-full py-3 bg-gradient-to-r from-[color:var(--accent)] to-purple-600 text-white border-none rounded-xl font-sans text-sm font-semibold cursor-pointer transition-all duration-200 mt-1 hover:shadow-glow hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0";

export const ghostButtonStyles =
    "bg-none border-none text-[color:var(--accent)] font-sans text-[13px] font-medium cursor-pointer p-0 transition-all duration-150 hover:text-[color:var(--accent-hover)] hover:underline";

// ─── Shared helper functions ──────────────────────────────────────────────────
/**
 * Format seconds into "Xm Ys" string.
 * @param {number|null} seconds
 */
export const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
};

/**
 * Returns Tailwind class string for coloured score badges.
 * @param {number} score  0-100
 */
export const getScoreClass = (score) => {
    if (score >= 80) return "bg-[color:var(--success-light)] text-[color:var(--success)]";
    if (score >= 50) return "bg-[color:var(--warning-light)] text-[color:var(--warning)]";
    return "bg-[color:var(--danger-light)] text-[color:var(--danger)]";
};

/**
 * Returns Tailwind text-color class for score (no background).
 * @param {number} score  0-100
 */
export const getScoreTextClass = (score) => {
    if (score >= 80) return "text-[color:var(--success)]";
    if (score >= 50) return "text-[color:var(--warning)]";
    return "text-[color:var(--danger)]";
};
