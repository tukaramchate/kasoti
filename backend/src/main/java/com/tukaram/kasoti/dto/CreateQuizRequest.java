package com.tukaram.kasoti.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for creating/updating quizzes.
 * Prevents mass assignment — only safe fields are accepted from the client.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateQuizRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be at most 255 characters")
    private String title;

    @Size(max = 2000, message = "Description must be at most 2000 characters")
    private String description;

    private String category;

    @Min(value = 1, message = "Time limit must be at least 1 minute")
    private Integer timeLimitMinutes;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Boolean negativeMarking;
    private Boolean shuffleQuestions;
    private Boolean shuffleOptions;
    private Integer passPercentage;

    @Size(max = 10, message = "Difficulty must be at most 10 characters")
    private String difficulty;

    @Size(max = 500, message = "Tags must be at most 500 characters")
    private String tags;

    @Valid
    private List<QuestionRequest> questions;

    /**
     * Inner DTO for questions — prevents client from setting question IDs or
     * other internal fields directly.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionRequest {
        @NotBlank(message = "Question text is required")
        private String text;

        private String questionType; // MCQ, MSQ, TRUE_FALSE, DESCRIPTIVE

        private List<String> options;
        private String correctOption;
        private List<String> correctOptions;
        private String modelAnswer;

        @Size(max = 1000, message = "Keywords must be at most 1000 characters")
        private String keywords;

        @Min(value = 1, message = "Marks must be at least 1")
        private Integer marks;
    }
}
