package com.tukaram.kasoti.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Request DTO for submitting quiz answers.
 * <p>
 * Backward compatible — existing clients sending only {@code answers} will
 * continue to work for MCQ and TRUE_FALSE quizzes.
 * <ul>
 *   <li>{@code answers} — questionId → single selected option (MCQ, TRUE_FALSE).</li>
 *   <li>{@code multiAnswers} — questionId → list of selected options (MSQ).</li>
 *   <li>{@code textAnswers} — questionId → free-text answer (DESCRIPTIVE).</li>
 * </ul>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitQuizRequest {

    /**
     * Single-option answers: questionId → selectedOption.
     * Used for MCQ and TRUE_FALSE questions.
     * Backward compatible with existing frontend.
     */
    private Map<Long, String> answers;

    /**
     * Multi-option answers: questionId → list of selected options.
     * Used for MSQ questions.
     */
    private Map<Long, List<String>> multiAnswers;

    /**
     * Text answers: questionId → free-text response.
     * Used for DESCRIPTIVE questions.
     */
    private Map<Long, String> textAnswers;

    private Integer timeTakenSeconds;
}
