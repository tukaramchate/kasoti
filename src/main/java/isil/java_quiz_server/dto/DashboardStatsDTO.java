package isil.java_quiz_server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for teacher dashboard statistics.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {
    private Long totalQuizzes;
    private Long publishedQuizzes;
    private Long draftQuizzes;
    private Long closedQuizzes;
    private Long totalAttempts;
    private Double averageScore;
}
