package com.tukaram.kasoti.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO for quiz-level analytics, aggregating per-question analytics.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAnalyticsDTO {
    private Long quizId;
    private String quizTitle;
    private Integer totalAttempts;
    private Double averageScore;
    private Double medianScore;
    private Double standardDeviation;

    /** Score range bucket (e.g. "0-10", "11-20") → count of students. */
    private Map<String, Integer> scoreDistribution;

    /** Per-question analytics list. */
    private List<QuestionAnalyticsDTO> questionAnalytics;

    /** Top N hardest questions (lowest difficulty index). */
    private List<QuestionAnalyticsDTO> hardestQuestions;

    /** Top N easiest questions (highest difficulty index). */
    private List<QuestionAnalyticsDTO> easiestQuestions;

    /** Questions with poor discrimination (discrimination index < 0.2). */
    private List<QuestionAnalyticsDTO> poorDiscriminators;
}
