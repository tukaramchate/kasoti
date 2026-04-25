package com.tukaram.kasoti.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO to start a proctoring session.
 * The reference face image (captured from webcam before exam) is sent as Base64.
 */
@Data
public class StartProctoringRequest {

    @NotNull(message = "quizId is required")
    private Long quizId;

    /** Base64-encoded reference face image (data URI or raw base64). */
    @NotBlank(message = "referenceImageBase64 is required")
    private String referenceImageBase64;
}
