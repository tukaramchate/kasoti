package com.tukaram.kasoti.model;

/**
 * Lifecycle status of a proctoring session.
 */
public enum ProctoringStatus {
    ACTIVE,      // Exam in progress — monitoring running
    TERMINATED,  // Exam terminated due to too many violations
    COMPLETED    // Exam submitted normally
}
