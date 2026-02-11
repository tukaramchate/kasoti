package com.tukaram.kasoti.dto;

import com.tukaram.kasoti.model.QuizStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight DTO for quiz listings (without questions).
 * Used in GET /api/quizzes for better performance.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizSummaryDTO {
    private Long id;
    private String title;
    private String description;
    private String category;
    private QuizStatus status;
    private String creatorUsername;
    private int questionCount;
    private int totalMarks;
    private String shareCode;
    private String difficulty;
    private String tags;
    private Integer timeLimitMinutes;
}
