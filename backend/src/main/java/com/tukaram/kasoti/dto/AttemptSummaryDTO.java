package com.tukaram.kasoti.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for student attempt history — safe for serialization without
 * exposing full Quiz/User entities or correct answers.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttemptSummaryDTO {
    private Long attemptId;
    private String username;
    private Long quizId;
    private String quizTitle;
    private String quizCategory;
    private Integer score;
    private Integer marksObtained;
    private Integer totalMarks;
    private Integer correctAnswers;
    private Integer totalQuestions;
    private Integer timeTakenSeconds;
    private LocalDateTime attemptedAt;
}
