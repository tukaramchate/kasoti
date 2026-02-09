package isil.java_quiz_server.dto;

/**
 * DTO for teacher dashboard statistics.
 */
public class DashboardStatsDTO {
    private Long totalQuizzes;
    private Long publishedQuizzes;
    private Long draftQuizzes;
    private Long closedQuizzes;
    private Long totalAttempts;
    private Double averageScore;

    public DashboardStatsDTO() {
    }

    public Long getTotalQuizzes() {
        return totalQuizzes;
    }

    public void setTotalQuizzes(Long totalQuizzes) {
        this.totalQuizzes = totalQuizzes;
    }

    public Long getPublishedQuizzes() {
        return publishedQuizzes;
    }

    public void setPublishedQuizzes(Long publishedQuizzes) {
        this.publishedQuizzes = publishedQuizzes;
    }

    public Long getDraftQuizzes() {
        return draftQuizzes;
    }

    public void setDraftQuizzes(Long draftQuizzes) {
        this.draftQuizzes = draftQuizzes;
    }

    public Long getClosedQuizzes() {
        return closedQuizzes;
    }

    public void setClosedQuizzes(Long closedQuizzes) {
        this.closedQuizzes = closedQuizzes;
    }

    public Long getTotalAttempts() {
        return totalAttempts;
    }

    public void setTotalAttempts(Long totalAttempts) {
        this.totalAttempts = totalAttempts;
    }

    public Double getAverageScore() {
        return averageScore;
    }

    public void setAverageScore(Double averageScore) {
        this.averageScore = averageScore;
    }
}
