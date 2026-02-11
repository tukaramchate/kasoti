package com.tukaram.kasoti.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for individual answer in attempt review.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerDTO {
    private Long questionId;
    private String questionText;
    private String selectedOption;
    private String correctOption;
    private Boolean isCorrect;
    private Integer marksObtained;
    private Integer maxMarks;
}
