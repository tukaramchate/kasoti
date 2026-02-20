package com.tukaram.kasoti.dto;

import com.tukaram.kasoti.model.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for Question that excludes the correct answer.
 * Used when returning quizzes to students.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionDTO {
    private Long id;
    private String text;
    private List<String> options;

    /**
     * Question type — MCQ (default), MSQ, TRUE_FALSE, DESCRIPTIVE.
     * Frontend uses this to render the appropriate input component.
     */
    @Builder.Default
    private QuestionType questionType = QuestionType.MCQ;

    /**
     * Marks allocated for this question.
     * Useful for the student to know question weightage.
     */
    private Integer marks;
    // No correctOption field - students can't see the answer!
}
