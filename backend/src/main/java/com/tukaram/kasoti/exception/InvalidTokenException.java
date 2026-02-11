package com.tukaram.kasoti.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a JWT token is invalid or expired.
 */
public class InvalidTokenException extends BaseAppException {

    public InvalidTokenException(String message) {
        super(message);
    }

    public InvalidTokenException(String message, Throwable cause) {
        super(message, cause);
    }

    public InvalidTokenException() {
        super("Invalid or expired authentication token");
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.UNAUTHORIZED;
    }

    @Override
    public String getErrorCode() {
        return "INVALID_TOKEN";
    }
}
