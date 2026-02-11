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
    private String username;
    private String category;
    private List<QuestionDTO> questions;
}
