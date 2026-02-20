package com.tukaram.kasoti.model;

/**
 * Evaluation status for quiz answers.
 *
 * <ul>
 *   <li>{@code AUTO_GRADED} — Scored automatically (MCQ, MSQ, TRUE_FALSE).</li>
 *   <li>{@code PENDING} — Awaiting manual evaluation (DESCRIPTIVE).</li>
 *   <li>{@code EVALUATED} — Manually evaluated by teacher.</li>
 * </ul>
 */
public enum EvaluationStatus {
    AUTO_GRADED,
    PENDING,
    EVALUATED
}
