package com.tukaram.kasoti.dto;

import com.tukaram.kasoti.model.QuizStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for quiz with attempt statistics.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizStatisticsDTO {
    private Long id;
    private String title;
    private String description;
    private String category;
    private QuizStatus status;
    private String shareCode;
    private Integer questionCount;
    private Integer totalMarks;
    private Long attemptCount;
    private Double averageScore;
}
