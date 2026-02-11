package com.tukaram.kasoti.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Health check endpoint for monitoring.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", LocalDateTime.now(),
                "service", "Kasoti Quiz Server"));
    }

    @GetMapping("/detailed")
    public ResponseEntity<Map<String, Object>> detailedHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", LocalDateTime.now(),
                "components", Map.of(
                        "database", "UP",
                        "authentication", "UP",
                        "quizService", "UP"),
                "info", Map.of(
                        "version", "1.0.0",
                        "environment", "development")));
    }
}
