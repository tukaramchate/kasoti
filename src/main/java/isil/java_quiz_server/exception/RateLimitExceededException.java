package isil.java_quiz_server.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when rate limit is exceeded.
 * Returns HTTP 429 Too Many Requests.
 */
@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String message) {
        super(message);
    }

    public RateLimitExceededException() {
        super("Rate limit exceeded. Please try again later.");
    }

    public RateLimitExceededException(int limit, String timeWindow) {
        super(String.format("Rate limit exceeded: Maximum %d requests per %s", limit, timeWindow));
    }
}
