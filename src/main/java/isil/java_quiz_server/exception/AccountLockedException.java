package isil.java_quiz_server.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when an account is locked due to too many failed login
 * attempts.
 */
public class AccountLockedException extends BaseAppException {

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

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.LOCKED;
    }

    @Override
    public String getErrorCode() {
        return "ACCOUNT_LOCKED";
    }
}
