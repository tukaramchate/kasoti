package isil.java_quiz_server.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when an account is locked due to too many failed login
 * attempts.
 * Returns HTTP 423 Locked.
 */
@ResponseStatus(HttpStatus.LOCKED)
public class AccountLockedException extends RuntimeException {

    private final long remainingMinutes;

    public AccountLockedException(String message) {
        super(message);
        this.remainingMinutes = 0;
    }

    public AccountLockedException(String message, long remainingMinutes) {
        super(message);
        this.remainingMinutes = remainingMinutes;
    }

    public AccountLockedException(long remainingMinutes) {
        super(String.format("Account is locked. Please try again in %d minutes.", remainingMinutes));
        this.remainingMinutes = remainingMinutes;
    }

    public long getRemainingMinutes() {
        return remainingMinutes;
    }
}
