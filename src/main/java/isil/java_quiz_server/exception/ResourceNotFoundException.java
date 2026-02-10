package isil.java_quiz_server.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a requested resource does not exist.
 */
public class ResourceNotFoundException extends BaseAppException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }

    @Override
    public String getErrorCode() {
        return "NOT_FOUND";
    }
}
