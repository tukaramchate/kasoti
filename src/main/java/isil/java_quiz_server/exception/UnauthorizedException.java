package isil.java_quiz_server.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when authentication fails.
 */
public class UnauthorizedException extends BaseAppException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.UNAUTHORIZED;
    }

    @Override
    public String getErrorCode() {
        return "UNAUTHORIZED";
    }
}
