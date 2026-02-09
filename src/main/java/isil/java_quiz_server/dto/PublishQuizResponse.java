package isil.java_quiz_server.dto;

/**
 * Response DTO for quiz publishing with share link.
 */
public class PublishQuizResponse {
    private Long quizId;
    private String title;
    private String shareCode;
    private String shareUrl;

    public PublishQuizResponse() {
    }

    public PublishQuizResponse(Long quizId, String title, String shareCode, String shareUrl) {
        this.quizId = quizId;
        this.title = title;
        this.shareCode = shareCode;
        this.shareUrl = shareUrl;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getShareCode() {
        return shareCode;
    }

    public void setShareCode(String shareCode) {
        this.shareCode = shareCode;
    }

    public String getShareUrl() {
        return shareUrl;
    }

    public void setShareUrl(String shareUrl) {
        this.shareUrl = shareUrl;
    }
}
