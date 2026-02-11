package com.tukaram.kasoti.exception;

import org.springframework.http.HttpStatus;

/**
 * Abstract base exception for all application-specific exceptions.
 * Each subclass declares its own HTTP status and error code,
 * enabling a single generic handler in GlobalExceptionHandler.
 */
public abstract class BaseAppException extends RuntimeException {

    protected BaseAppException(String message) {
        super(message);
    }

    protected BaseAppException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * The HTTP status code to return in the error response.
     */
    public abstract HttpStatus getStatus();

    /**
     * A machine-readable error code (e.g. "NOT_FOUND", "BAD_REQUEST").
     */
    public abstract String getErrorCode();
}
