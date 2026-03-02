package com.tukaram.kasoti.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO for per-question analytics data.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionAnalyticsDTO {
    private Long questionId;
    private String questionText;
    private String questionType;
    private Integer marks;

    /** Proportion of students who answered correctly (0.0 – 1.0). */
    private Double difficultyIndex;

    /** Point-biserial correlation between correctness and total score (-1.0 – 1.0). */
    private Double discriminationIndex;

    /** Average time students spent on this question (seconds). */
    private Double averageTimeSeconds;

    /** Total number of attempts for this question. */
    private Integer totalAttempts;

    /** Option text → count of students who selected it (MCQ / MSQ / TRUE_FALSE). */
    private Map<String, Integer> optionDistribution;

    /** Correct option (MCQ / TRUE_FALSE). */
    private String correctOption;

    /** Correct options (MSQ). */
    private List<String> correctOptions;

    /** Marks obtained value → count of students (DESCRIPTIVE). */
    private Map<String, Integer> marksDistribution;
}
