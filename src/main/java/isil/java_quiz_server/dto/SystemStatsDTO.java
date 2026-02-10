package isil.java_quiz_server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for system-wide statistics (admin dashboard).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}
