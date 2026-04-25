package com.tukaram.kasoti.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO for submitting a webcam frame for AI analysis.
 */
@Data
public class AnalyzeFrameRequest {

    @NotNull(message = "quizId is required")
    private Long quizId;

    /** Base64-encoded current webcam frame. */
    @NotBlank(message = "imageBase64 is required")
    private String imageBase64;

    /**
     * Client-side violation type for events that don't require AI analysis
     * (e.g. TAB_SWITCH, FULLSCREEN_EXIT). When set, the backend skips the AI
     * call and logs the violation directly.
     */
    private String clientViolationType;
}
