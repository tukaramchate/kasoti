package com.tukaram.kasoti.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned after each frame analysis.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProctoringResultResponse {

    /**
     * AI or client detection outcome:
     * OK | NO_FACE | MULTIPLE_PERSON | PHONE_DETECTED | FACE_MISMATCH |
     * TAB_SWITCH | FULLSCREEN_EXIT | EXAM_TERMINATED
     */
    private String status;

    /** Human-readable warning message shown in the frontend overlay. */
    private String message;

    /** Current cumulative warning count for this session. */
    private int warningCount;

    /** Maximum warnings allowed before termination. */
    private int warningLimit;

    /** Whether the exam has been terminated due to too many violations. */
    private boolean terminated;
}
