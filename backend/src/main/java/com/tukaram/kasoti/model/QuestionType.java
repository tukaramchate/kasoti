package com.tukaram.kasoti.model;

/**
 * Supported question types for quizzes.
 *
 * <ul>
 *   <li>{@code MCQ} — Multiple-choice, exactly one correct option (default, backward-compatible).</li>
 *   <li>{@code MSQ} — Multiple-select, one or more correct options.</li>
 *   <li>{@code TRUE_FALSE} — Only "True" / "False" options allowed.</li>
 *   <li>{@code DESCRIPTIVE} — Free-text answer; no options; requires manual evaluation.</li>
 * </ul>
 */
public enum QuestionType {
    MCQ,
    MSQ,
    TRUE_FALSE,
    DESCRIPTIVE
}
