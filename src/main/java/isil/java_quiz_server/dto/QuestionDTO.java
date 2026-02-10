package isil.java_quiz_server.dto;

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
    // No correctOption field - students can't see the answer!
}
