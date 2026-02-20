package com.tukaram.kasoti.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check endpoint for monitoring.
 */
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", LocalDateTime.now(),
                "service", "Kasoti Quiz Server"));
    }

    @GetMapping("/detailed")
    public ResponseEntity<Map<String, Object>> detailedHealth() {
        String dbStatus = "DOWN";
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(3)) {
                dbStatus = "UP";
            }
        } catch (Exception ignored) {
            // DB is unreachable
        }

        String overallStatus = "UP".equals(dbStatus) ? "UP" : "DEGRADED";

        Map<String, Object> result = new HashMap<>();
        result.put("status", overallStatus);
        result.put("timestamp", LocalDateTime.now());
        result.put("components", Map.of(
                "database", dbStatus,
                "authentication", "UP",
                "quizService", "UP"));
        result.put("info", Map.of(
                "version", "1.0.0",
                "environment", "development"));
        return ResponseEntity.ok(result);
    }
}
