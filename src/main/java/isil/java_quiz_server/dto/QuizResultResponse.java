package isil.java_quiz_server.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for quiz results.
 */
@Data
@NoArgsConstructor
public class QuizResultResponse {

    private Long quizId;
    private String quizTitle;
    private Integer score;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Double percentage;
    private Integer timeTakenSeconds;
    private LocalDateTime attemptedAt;
    private String message;

    public QuizResultResponse(Long quizId, String quizTitle, Integer correctAnswers,
            Integer totalQuestions, Integer timeTakenSeconds) {
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.correctAnswers = correctAnswers;
        this.totalQuestions = totalQuestions;
        this.score = (int) ((correctAnswers * 100.0) / totalQuestions);
        this.percentage = (correctAnswers * 100.0) / totalQuestions;
        this.timeTakenSeconds = timeTakenSeconds;
        this.attemptedAt = LocalDateTime.now();
        this.message = generateMessage();
    }

    private String generateMessage() {
        if (percentage >= 90)
            return "Excellent! Outstanding performance!";
        if (percentage >= 75)
            return "Great job! Well done!";
        if (percentage >= 50)
            return "Good effort! Keep practicing!";
        return "Don't give up! Try again!";
    }
}
