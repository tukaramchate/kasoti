package isil.java_quiz_server.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when rate limit is exceeded.
 */
public class RateLimitExceededException extends BaseAppException {

    public RateLimitExceededException(String message) {
        super(message);
    }

    public RateLimitExceededException() {
        super("Rate limit exceeded. Please try again later.");
    }

    public RateLimitExceededException(int limit, String timeWindow) {
        super(String.format("Rate limit exceeded: Maximum %d requests per %s", limit, timeWindow));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.TOO_MANY_REQUESTS;
    }

    @Override
    public String getErrorCode() {
        return "TOO_MANY_REQUESTS";
    }
}
