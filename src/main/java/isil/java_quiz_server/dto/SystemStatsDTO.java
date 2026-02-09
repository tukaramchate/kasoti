package isil.java_quiz_server.dto;

/**
 * DTO for system-wide statistics (admin dashboard).
 */
public class SystemStatsDTO {
    private Long totalUsers;
    private Long totalAdmins;
    private Long totalTeachers;
    private Long totalStudents;
    private Long totalQuizzes;
    private Long publishedQuizzes;
    private Long draftQuizzes;
    private Long closedQuizzes;
    private Long totalAttempts;

    public SystemStatsDTO() {
    }

    public Long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(Long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public Long getTotalAdmins() {
        return totalAdmins;
    }

    public void setTotalAdmins(Long totalAdmins) {
        this.totalAdmins = totalAdmins;
    }

    public Long getTotalTeachers() {
        return totalTeachers;
    }

    public void setTotalTeachers(Long totalTeachers) {
        this.totalTeachers = totalTeachers;
    }

    public Long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(Long totalStudents) {
        this.totalStudents = totalStudents;
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
}
