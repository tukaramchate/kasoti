import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

const ConfirmDialog = ({ open, title, message, confirmText = "Confirm", cancelText = "Cancel", variant = "danger", onConfirm, onCancel }) => {
  if (!open) return null;

  const confirmBtnClass = variant === "danger"
    ? "py-2.5 px-5 bg-[color:var(--danger)] text-white border-none rounded-lg text-[13px] font-medium cursor-pointer transition-all hover:opacity-90"
    : "py-2.5 px-5 bg-[color:var(--accent)] text-white border-none rounded-lg text-[13px] font-medium cursor-pointer transition-all hover:bg-[color:var(--accent-hover)]";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onCancel}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl p-6 w-full max-w-sm shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${variant === "danger" ? "bg-[color:var(--danger-light)] text-[color:var(--danger)]" : "bg-[color:var(--accent-light)] text-[color:var(--accent)]"}`}>
            <FiAlertTriangle />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[color:var(--text-primary)] mb-1">{title}</h3>
            <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            className="py-2.5 px-5 bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)] border border-[color:var(--border)] rounded-lg text-[13px] font-medium cursor-pointer transition-all hover:text-[color:var(--text-primary)]"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button className={confirmBtnClass} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
