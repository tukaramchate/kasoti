package isil.java_quiz_server.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a service is temporarily unavailable.
 */
public class ServiceUnavailableException extends BaseAppException {

    public ServiceUnavailableException(String message) {
        super(message);
    }

    public ServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }

    public ServiceUnavailableException() {
        super("Service is temporarily unavailable. Please try again later.");
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.SERVICE_UNAVAILABLE;
    }

    @Override
    public String getErrorCode() {
        return "SERVICE_UNAVAILABLE";
    }
}
