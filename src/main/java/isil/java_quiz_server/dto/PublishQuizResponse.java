package isil.java_quiz_server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for quiz publishing with share link.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublishQuizResponse {
    private Long quizId;
    private String title;
    private String shareCode;
    private String shareUrl;
}
