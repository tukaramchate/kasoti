package isil.java_quiz_server.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for managing password reset tokens.
 * In production, tokens should be stored in the database and emails sent via
 * SMTP.
 */
@Service
public class PasswordResetService {

    private static final int TOKEN_LENGTH = 32;
    private static final int TOKEN_EXPIRY_MINUTES = 30;
    private static final SecureRandom secureRandom = new SecureRandom();

    // In production, use database storage
    private final ConcurrentHashMap<String, ResetToken> tokenStore = new ConcurrentHashMap<>();

    /**
     * Generate a password reset token for the given email.
     * Returns the token (in production, this would be sent via email).
     */
    public String generateResetToken(String email) {
        // Generate secure token
        byte[] tokenBytes = new byte[TOKEN_LENGTH];
        secureRandom.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

        // Store token with expiry
        ResetToken resetToken = new ResetToken(email, LocalDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES));
        tokenStore.put(token, resetToken);

        // Clean up expired tokens periodically
        cleanExpiredTokens();

        return token;
    }

    /**
     * Validate a reset token and return the associated email if valid.
     */
    public String validateToken(String token) {
        ResetToken resetToken = tokenStore.get(token);
        if (resetToken == null) {
            return null;
        }

        if (LocalDateTime.now().isAfter(resetToken.expiresAt)) {
            tokenStore.remove(token);
            return null;
        }

        return resetToken.email;
    }

    /**
     * Invalidate a token after successful password reset.
     */
    public void invalidateToken(String token) {
        tokenStore.remove(token);
    }

    /**
     * Clean up expired tokens from the store.
     */
    private void cleanExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        tokenStore.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt));
    }

    /**
     * Internal class to hold reset token data.
     */
    private static class ResetToken {
        final String email;
        final LocalDateTime expiresAt;

        ResetToken(String email, LocalDateTime expiresAt) {
            this.email = email;
            this.expiresAt = expiresAt;
        }
    }
}
