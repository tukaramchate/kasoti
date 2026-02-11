package com.tukaram.kasoti.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when there's a conflict with existing data.
 */
public class ConflictException extends BaseAppException {

    public ConflictException(String message) {
        super(message);
    }

    public ConflictException(String message, Throwable cause) {
        super(message, cause);
    }

    public ConflictException(String resource, String field, Object value) {
        super(String.format("%s with %s '%s' already exists", resource, field, value));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.CONFLICT;
    }

    @Override
    public String getErrorCode() {
        return "CONFLICT";
    }
}
