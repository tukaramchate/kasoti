package isil.java_quiz_server.dto;

import java.time.LocalDateTime;

/**
 * Response DTO for quiz results.
 */
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

    public QuizResultResponse() {
    }

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

    // Getters and Setters
    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public String getQuizTitle() {
        return quizTitle;
    }

    public void setQuizTitle(String quizTitle) {
        this.quizTitle = quizTitle;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public Integer getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(Integer correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }

    public Integer getTimeTakenSeconds() {
        return timeTakenSeconds;
    }

    public void setTimeTakenSeconds(Integer timeTakenSeconds) {
        this.timeTakenSeconds = timeTakenSeconds;
    }

    public LocalDateTime getAttemptedAt() {
        return attemptedAt;
    }

    public void setAttemptedAt(LocalDateTime attemptedAt) {
        this.attemptedAt = attemptedAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
