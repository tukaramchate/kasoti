package com.tukaram.kasoti.model;

/**
 * Quiz status for controlling visibility and access.
 */
public enum QuizStatus {
    DRAFT, // Not visible to students, can be edited
    PUBLISHED, // Active and shareable via link
    CLOSED // No longer accepting new attempts
}
