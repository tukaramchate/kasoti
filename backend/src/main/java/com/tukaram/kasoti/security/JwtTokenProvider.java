package com.tukaram.kasoti.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import com.tukaram.kasoti.model.Role;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration; // 24 hours in milliseconds

    @PostConstruct
    public void validateSecret() {
        if (jwtSecret == null || jwtSecret.isEmpty()) {
            throw new IllegalStateException(
                    "JWT_SECRET environment variable must be set. " +
                            "Example: set JWT_SECRET=yourBase64EncodedSecretKey");
        }
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
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
