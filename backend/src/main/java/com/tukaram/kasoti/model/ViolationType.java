package com.tukaram.kasoti.model;

/**
 * Types of proctoring violations that can be detected.
 */
public enum ViolationType {
    NO_FACE,          // No face visible in webcam frame
    MULTIPLE_PERSON,  // More than one face detected
    PHONE_DETECTED,   // Mobile phone visible in frame
    FACE_MISMATCH,    // Face doesn't match reference captured at exam start
    TAB_SWITCH,       // User switched to another browser tab
    FULLSCREEN_EXIT   // User exited fullscreen (handled by FullScreenGuard too)
}
