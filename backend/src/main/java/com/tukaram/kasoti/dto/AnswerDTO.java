package com.tukaram.kasoti.dto;

import com.tukaram.kasoti.model.EvaluationStatus;
import com.tukaram.kasoti.model.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for individual answer in attempt review.
 * Supports MCQ, MSQ, TRUE_FALSE, and DESCRIPTIVE answers.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerDTO {
    private Long id;          // Answer entity ID — needed for evaluation endpoint
    private Long questionId;
    private String questionText;
    private QuestionType questionType;

    // === MCQ / TRUE_FALSE ===
    private String selectedOption;
    private String correctOption;

    // === MSQ ===
    private List<String> selectedOptions;
    private List<String> correctOptions;

    // === DESCRIPTIVE ===
    private String textAnswer;
    private String modelAnswer;

    // === Grading ===
    private Boolean isCorrect;
    private Integer marksObtained;
    private Integer maxMarks;
    private EvaluationStatus evaluationStatus;
    private String evaluationComment;
}
