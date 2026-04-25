package com.tukaram.kasoti.service;

import com.tukaram.kasoti.dto.ProctoringResultResponse;
import com.tukaram.kasoti.dto.ViolationLogDTO;
import com.tukaram.kasoti.exception.BadRequestException;
import com.tukaram.kasoti.exception.ResourceNotFoundException;
import com.tukaram.kasoti.model.*;
import com.tukaram.kasoti.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Orchestrates proctoring sessions: reference face storage, AI frame analysis,
 * warning counting, violation logging, and session termination.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProctoringService {

    private final ProctorSessionRepository sessionRepo;
    private final ProctorViolationRepository violationRepo;
    private final UserRepository userRepo;
    private final QuizRepository quizRepo;

    /** Warning limit — override via PROCTOR_WARNING_LIMIT env var or application.properties */
    @Value("${proctor.warning.limit:3}")
    private int defaultWarningLimit;

    /** URL of the Python AI microservice */
    @Value("${proctor.ai.url:http://localhost:5000}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;

    // ── Session Lifecycle ──────────────────────────────────────────────────────

    /**
     * Start a new proctoring session for a student/quiz combination.
     * Stores the reference face image as BYTEA in PostgreSQL.
     * Idempotent: if a session already exists, returns the existing one.
     */
    @Transactional
    public ProctorSession startSession(Long userId, Long quizId, String referenceImageBase64) {
        // Return existing session if already started (e.g. page refresh)
        return sessionRepo.findByUserIdAndQuizId(userId, quizId).orElseGet(() -> {
            User user = userRepo.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            Quiz quiz = quizRepo.findById(quizId)
                    .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

            // Decode Base64 reference image to bytes
            byte[] imageBytes = decodeBase64Image(referenceImageBase64);

            ProctorSession session = ProctorSession.builder()
                    .user(user)
                    .quiz(quiz)
                    .referenceImage(imageBytes)
                    .warningLimit(defaultWarningLimit)
                    .build();

            log.info("Proctoring session started: userId={} quizId={}", userId, quizId);
            return sessionRepo.save(session);
        });
    }

    /**
     * Analyze a webcam frame. Calls the Python AI service (or logs client-side
     * violations directly). Increments warnings and returns the result.
     */
    @Transactional
    public ProctoringResultResponse analyzeFrame(Long userId, Long quizId,
                                                  String imageBase64,
                                                  String clientViolationType) {
        ProctorSession session = sessionRepo.findByUserIdAndQuizId(userId, quizId)
                .orElseThrow(() -> new BadRequestException("No active proctoring session for this quiz"));

        // Already terminated — do not process further
        if (session.getStatus() == ProctoringStatus.TERMINATED) {
            return buildResponse("EXAM_TERMINATED", session, true);
        }

        String detectedViolation;
        byte[] frameBytes = null;

        // ── Client-side violations (TAB_SWITCH, FULLSCREEN_EXIT) ─────────────
        if (clientViolationType != null && !clientViolationType.isBlank()) {
            detectedViolation = clientViolationType;
        } else {
            // ── Call Python AI service ────────────────────────────────────────
            detectedViolation = callAiService(imageBase64, session.getReferenceImage());
            if (!"OK".equals(detectedViolation)) {
                // Store the offending frame as BYTEA evidence
                frameBytes = decodeBase64Image(imageBase64);
            }
        }

        // ── OK — no violation ─────────────────────────────────────────────────
        if ("OK".equals(detectedViolation)) {
            return buildResponse("OK", session, false);
        }

        // ── Log violation ─────────────────────────────────────────────────────
        ViolationType violationType = parseViolationType(detectedViolation);
        String severity = isSevere(violationType) ? "HIGH" : "LOW";

        ProctorViolation violation = ProctorViolation.builder()
                .session(session)
                .violationType(violationType)
                .severity(severity)
                .frameImage(frameBytes)
                .build();
        violationRepo.save(violation);

        // ── Increment warning count ───────────────────────────────────────────
        session.setWarningCount(session.getWarningCount() + 1);
        log.warn("Proctoring violation: userId={} quizId={} type={} warnings={}/{}",
                userId, quizId, violationType, session.getWarningCount(), session.getWarningLimit());

        // ── Check termination threshold ───────────────────────────────────────
        boolean terminated = session.getWarningCount() >= session.getWarningLimit();
        if (terminated) {
            session.setStatus(ProctoringStatus.TERMINATED);
            log.warn("Exam TERMINATED: userId={} quizId={}", userId, quizId);
        }
        sessionRepo.save(session);

        return buildResponse(terminated ? "EXAM_TERMINATED" : detectedViolation, session, terminated);
    }

    /**
     * Mark a session as COMPLETED (called when student submits exam normally).
     */
    @Transactional
    public void endSession(Long userId, Long quizId) {
        sessionRepo.findByUserIdAndQuizId(userId, quizId).ifPresent(session -> {
            if (session.getStatus() == ProctoringStatus.ACTIVE) {
                session.setStatus(ProctoringStatus.COMPLETED);
                sessionRepo.save(session);
                log.info("Proctoring session COMPLETED: userId={} quizId={}", userId, quizId);
            }
        });
    }

    // ── Query Methods ──────────────────────────────────────────────────────────

    /** Get current session status (for frontend polling). */
    public ProctorSession getSession(Long userId, Long quizId) {
        return sessionRepo.findByUserIdAndQuizId(userId, quizId)
                .orElseThrow(() -> new ResourceNotFoundException("ProctorSession", "user+quiz", userId + "/" + quizId));
    }

    /** Get all violations for a session (teacher/admin review). */
    public List<ViolationLogDTO> getViolations(Long sessionId) {
        ProctorSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ProctorSession", "id", sessionId));

        return violationRepo.findBySessionIdOrderByOccurredAtAsc(sessionId).stream()
                .map(v -> ViolationLogDTO.builder()
                        .id(v.getId())
                        .sessionId(sessionId)
                        .userId(session.getUser().getId())
                        .username(session.getUser().getUsername())
                        .quizId(session.getQuiz().getId())
                        .quizTitle(session.getQuiz().getTitle())
                        .violationType(v.getViolationType())
                        .severity(v.getSeverity())
                        .occurredAt(v.getOccurredAt())
                        .hasFrameImage(v.getFrameImage() != null)
                        .build())
                .collect(Collectors.toList());
    }

    // ── Internal Helpers ──────────────────────────────────────────────────────

    /**
     * Call the Python AI service and return the violation type string.
     * Falls back to "OK" on any communication error to avoid false positives.
     */
    @SuppressWarnings("unchecked")
    private String callAiService(String imageBase64, byte[] referenceImageBytes) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("image", imageBase64);

            // Re-encode stored BYTEA reference image back to Base64 for the AI service
            if (referenceImageBytes != null) {
                body.put("referenceImage", Base64.getEncoder().encodeToString(referenceImageBytes));
            }

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/detect", body, Map.class);

            if (response.getBody() != null) {
                return String.valueOf(response.getBody().getOrDefault("result", "OK"));
            }
        } catch (Exception e) {
            log.error("AI service call failed (treating as OK to avoid false positive): {}", e.getMessage());
        }
        return "OK";
    }

    private byte[] decodeBase64Image(String base64) {
        try {
            String data = base64.contains(",") ? base64.split(",", 2)[1] : base64;
            return Base64.getDecoder().decode(data);
        } catch (Exception e) {
            log.error("Base64 decode failed: {}", e.getMessage());
            return null;
        }
    }

    private ViolationType parseViolationType(String raw) {
        try {
            return ViolationType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ViolationType.NO_FACE;
        }
    }

    private boolean isSevere(ViolationType type) {
        return type == ViolationType.PHONE_DETECTED
                || type == ViolationType.FACE_MISMATCH
                || type == ViolationType.MULTIPLE_PERSON;
    }

    private ProctoringResultResponse buildResponse(String status, ProctorSession session, boolean terminated) {
        return ProctoringResultResponse.builder()
                .status(status)
                .message(buildMessage(status, session))
                .warningCount(session.getWarningCount())
                .warningLimit(session.getWarningLimit())
                .terminated(terminated)
                .build();
    }

    private String buildMessage(String status, ProctorSession session) {
        int remaining = session.getWarningLimit() - session.getWarningCount();
        return switch (status) {
            case "NO_FACE"         -> "No face detected. Warning " + session.getWarningCount() + "/" + session.getWarningLimit();
            case "MULTIPLE_PERSON" -> "Multiple persons detected! Warning " + session.getWarningCount() + "/" + session.getWarningLimit();
            case "PHONE_DETECTED"  -> "Mobile phone detected! Warning " + session.getWarningCount() + "/" + session.getWarningLimit();
            case "FACE_MISMATCH"   -> "Face does not match. Warning " + session.getWarningCount() + "/" + session.getWarningLimit();
            case "TAB_SWITCH"      -> "Tab switching detected. Warning " + session.getWarningCount() + "/" + session.getWarningLimit();
            case "FULLSCREEN_EXIT" -> "Fullscreen exit detected. Warning " + session.getWarningCount() + "/" + session.getWarningLimit();
            case "EXAM_TERMINATED" -> "Exam terminated due to repeated violations.";
            default                -> "OK";
        };
    }
}
