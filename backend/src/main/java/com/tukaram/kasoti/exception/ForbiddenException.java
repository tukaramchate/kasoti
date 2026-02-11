package com.tukaram.kasoti.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a user tries to access a resource they don't have
 * permission for.
 */
public class ForbiddenException extends BaseAppException {

    public ForbiddenException(String message) {
        super(message);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(message, cause);
    }

    public ForbiddenException(String resource, String action) {
        super(String.format("Access denied: You don't have permission to %s this %s", action, resource));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.FORBIDDEN;
    }

    @Override
    public String getErrorCode() {
        return "FORBIDDEN";
    }
}
