package com.tukaram.kasoti.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for Quiz that uses QuestionDTO (without correct answers).
 * Used when returning quizzes to students.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizDTO {
    private Long id;
    private String title;
    private String description;
    private String username;
    private String category;
    private String difficulty;
    private String tags;
    private String shareCode;
    private Integer timeLimitMinutes;
    private Integer passPercentage;
    private Boolean negativeMarking;
    private Boolean shuffleQuestions;
    private Boolean shuffleOptions;
    private java.time.LocalDateTime startTime;
    private java.time.LocalDateTime endTime;
    private Integer totalMarks;
    private List<QuestionDTO> questions;
}
