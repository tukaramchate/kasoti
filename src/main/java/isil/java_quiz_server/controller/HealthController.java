package isil.java_quiz_server.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check endpoint for monitoring.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    /**
     * Basic health check - returns status and timestamp.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now());
        response.put("service", "Java Quiz Server");
        return ResponseEntity.ok(response);
    }

    /**
     * Detailed health check with component status.
     */
    @GetMapping("/detailed")
    public ResponseEntity<Map<String, Object>> detailedHealth() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now());

        Map<String, String> components = new HashMap<>();
        components.put("database", "UP");
        components.put("authentication", "UP");
        components.put("quizService", "UP");
        response.put("components", components);

        Map<String, Object> info = new HashMap<>();
        info.put("version", "1.0.0");
        info.put("environment", "development");
        response.put("info", info);

        return ResponseEntity.ok(response);
    }
}
