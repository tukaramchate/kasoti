package com.tukaram.kasoti.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import com.tukaram.kasoti.model.Role;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration; // 24 hours in milliseconds

    @PostConstruct
    public void validateSecret() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET environment variable must be set. " +
                            "Example: set JWT_SECRET=yourBase64EncodedSecretKey");
        }
        // Ensure at least 256-bit key (32 bytes = ~43 base64 chars)
        try {
            byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
            if (keyBytes.length < 32) {
                throw new IllegalStateException(
                        "JWT_SECRET must be at least 256 bits (32 bytes) when decoded. " +
                                "Current key is only " + keyBytes.length + " bytes.");
            }
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("JWT_SECRET must be a valid Base64-encoded string.", e);
        }
        log.info("JWT secret validated successfully ({} bytes).",
                Decoders.BASE64.decode(jwtSecret).length);
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String username, Long userId, Role role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("role", role.name())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Parse and return all claims from a validated token.
     * Call this once per request instead of parsing multiple times.
     */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getUsernameFromClaims(Claims claims) {
        return claims.getSubject();
    }

    public Long getUserIdFromClaims(Claims claims) {
        return claims.get("userId", Long.class);
    }

    public Role getRoleFromClaims(Claims claims) {
        return Role.valueOf(claims.get("role", String.class));
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token); // reuse same parser — avoids double parse
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
