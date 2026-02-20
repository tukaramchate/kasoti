package com.tukaram.kasoti.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for a teacher to manually evaluate a DESCRIPTIVE answer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluateAnswerRequest {

    /**
     * Marks awarded for this answer (0 to question's max marks).
     */
    @NotNull(message = "Marks are required")
    @Min(value = 0, message = "Marks cannot be negative")
    @Max(value = 1000, message = "Marks cannot exceed 1000")
    private Integer marks;

    /**
     * Optional teacher comment/feedback for the student.
     */
    @Size(max = 2000, message = "Comment must be at most 2000 characters")
    private String comment;
}
