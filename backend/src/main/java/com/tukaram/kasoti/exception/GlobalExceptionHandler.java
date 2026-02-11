package com.tukaram.kasoti.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Centralized exception handler for all REST controllers.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles ALL application-specific exceptions via the BaseAppException
     * hierarchy.
     * Each exception subclass provides its own HTTP status and error code.
     */
    @ExceptionHandler(BaseAppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(BaseAppException ex) {
        ErrorResponse error = ErrorResponse.builder()
                .status(ex.getStatus().value())
                .error(ex.getErrorCode())
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(error, ex.getStatus());
    }

    /**
     * Handles Jakarta Validation errors from @Valid annotations.
     * Returns field-level error details in the response.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });

        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("VALIDATION_ERROR")
                .message("Validation failed")
                .fieldErrors(fieldErrors)
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Catch-all handler for unexpected exceptions.
     * Logs the full stack trace via SLF4J and returns a generic error to the
     * client.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unexpected error occurred", ex);

        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("INTERNAL_SERVER_ERROR")
                .message("An unexpected error occurred")
                .build();
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
