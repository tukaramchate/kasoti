package isil.java_quiz_server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for detailed attempt view including all answers.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetailedAttemptDTO {
    private Long attemptId;
    private Long quizId;
    private String quizTitle;
    private Long userId;
    private String username;
    private Integer score;
    private Integer marksObtained;
    private Integer totalMarks;
    private Integer correctAnswers;
    private Integer totalQuestions;
    private Integer timeTakenSeconds;
    private LocalDateTime attemptedAt;
    private List<AnswerDTO> answers;
}
