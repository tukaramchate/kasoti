package com.tukaram.kasoti.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Request DTO for submitting quiz answers.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitQuizRequest {

    @NotNull(message = "Answers are required")
    private Map<Long, String> answers; // Map of questionId -> selectedAnswer

    private Integer timeTakenSeconds;
}
