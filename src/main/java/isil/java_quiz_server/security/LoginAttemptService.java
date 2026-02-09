package isil.java_quiz_server.security;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks failed login attempts and implements account lockout.
 * Locks accounts after 5 failed attempts for 15 minutes.
 */
@Component
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_TIME_MINUTES = 15;
    private static final long LOCK_TIME_MS = LOCK_TIME_MINUTES * 60 * 1000;

    // Map of username -> LoginAttemptInfo
    private final Map<String, LoginAttemptInfo> attempts = new ConcurrentHashMap<>();

    /**
     * Record a failed login attempt for a username.
     */
    public void loginFailed(String username) {
        LoginAttemptInfo info = attempts.computeIfAbsent(username, k -> new LoginAttemptInfo());
        info.incrementAttempts();
    }

    /**
     * Record a successful login - resets the attempt counter.
     */
    public void loginSucceeded(String username) {
        attempts.remove(username);
    }

    /**
     * Check if the account is currently locked.
     */
    public boolean isLocked(String username) {
        LoginAttemptInfo info = attempts.get(username);
        if (info == null) {
            return false;
        }

        // Check if lock has expired
        if (info.isLockExpired()) {
            attempts.remove(username);
            return false;
        }

        return info.getAttempts() >= MAX_ATTEMPTS;
    }

    /**
     * Get remaining attempts before lockout.
     */
    public int getRemainingAttempts(String username) {
        LoginAttemptInfo info = attempts.get(username);
        if (info == null) {
            return MAX_ATTEMPTS;
        }
        return Math.max(0, MAX_ATTEMPTS - info.getAttempts());
    }

    /**
     * Get remaining lockout time in minutes.
     */
    public long getRemainingLockTimeMinutes(String username) {
        LoginAttemptInfo info = attempts.get(username);
        if (info == null || !isLocked(username)) {
            return 0;
        }
        long elapsed = System.currentTimeMillis() - info.getLastAttemptTime();
        long remaining = LOCK_TIME_MS - elapsed;
        return Math.max(0, remaining / (60 * 1000));
    }

    /**
     * Inner class to track login attempt information.
     */
    private static class LoginAttemptInfo {
        private int attempts = 0;
        private long lastAttemptTime = 0;

        public void incrementAttempts() {
            this.attempts++;
            this.lastAttemptTime = System.currentTimeMillis();
        }

        public int getAttempts() {
            return attempts;
        }

        public long getLastAttemptTime() {
            return lastAttemptTime;
        }

        public boolean isLockExpired() {
            if (attempts < MAX_ATTEMPTS) {
                return false;
            }
            return System.currentTimeMillis() - lastAttemptTime > LOCK_TIME_MS;
        }
    }
}
