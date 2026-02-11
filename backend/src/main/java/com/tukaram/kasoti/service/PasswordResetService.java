package com.tukaram.kasoti.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for managing password reset tokens.
 * Tokens are stored in-memory with automatic expiry cleanup.
 * In production, consider database-backed storage and email delivery via SMTP.
 */
@Slf4j
@Service
public class PasswordResetService {

    private static final int TOKEN_LENGTH = 32;
    private static final int TOKEN_EXPIRY_MINUTES = 30;
    private static final SecureRandom secureRandom = new SecureRandom();

    private final ConcurrentHashMap<String, ResetToken> tokenStore = new ConcurrentHashMap<>();

    /**
     * Generate a password reset token for the given email.
     * Returns the token (in production, send via email instead).
     */
    public String generateResetToken(String email) {
        byte[] tokenBytes = new byte[TOKEN_LENGTH];
        secureRandom.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

        tokenStore.put(token, new ResetToken(email, LocalDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES)));
        log.debug("Password reset token generated for: {}", email);
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
        if (LocalDateTime.now().isAfter(resetToken.expiresAt())) {
            tokenStore.remove(token);
            return null;
        }
        return resetToken.email();
    }

    /**
     * Invalidate a token after successful password reset.
     */
    public void invalidateToken(String token) {
        tokenStore.remove(token);
    }

    /**
     * Periodically clean up expired tokens (every 10 minutes).
     */
    @Scheduled(fixedRate = 600_000)
    void cleanExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        int before = tokenStore.size();
        tokenStore.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt()));
        int removed = before - tokenStore.size();
        if (removed > 0) {
            log.debug("Cleaned {} expired reset tokens", removed);
        }
    }

    private record ResetToken(String email, LocalDateTime expiresAt) {}
}
