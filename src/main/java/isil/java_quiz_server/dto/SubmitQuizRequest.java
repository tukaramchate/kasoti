package isil.java_quiz_server.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

/**
 * Request DTO for submitting quiz answers.
 */
public class SubmitQuizRequest {

    @NotNull(message = "Answers are required")
    private Map<Long, String> answers; // Map of questionId -> selectedAnswer

    private Integer timeTakenSeconds;

    public Map<Long, String> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<Long, String> answers) {
        this.answers = answers;
    }

    public Integer getTimeTakenSeconds() {
        return timeTakenSeconds;
    }

    public void setTimeTakenSeconds(Integer timeTakenSeconds) {
        this.timeTakenSeconds = timeTakenSeconds;
    }
}
