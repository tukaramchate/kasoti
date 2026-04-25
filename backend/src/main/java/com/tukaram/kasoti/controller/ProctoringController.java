package com.tukaram.kasoti.controller;

import com.tukaram.kasoti.dto.AnalyzeFrameRequest;
import com.tukaram.kasoti.dto.ProctoringResultResponse;
import com.tukaram.kasoti.dto.StartProctoringRequest;
import com.tukaram.kasoti.dto.ViolationLogDTO;
import com.tukaram.kasoti.model.ProctorSession;
import com.tukaram.kasoti.security.UserPrincipal;
import com.tukaram.kasoti.service.ProctoringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the AI-based proctoring system.
 *
 * Student endpoints:   /api/proctoring/start, /analyze, /end, /session/{quizId}
 * Teacher/Admin:       /api/proctoring/violations/{sessionId}
 */
@RestController
@RequestMapping("/api/proctoring")
@RequiredArgsConstructor
@Tag(name = "Proctoring", description = "AI-based exam proctoring endpoints")
public class ProctoringController {

    private final ProctoringService proctoringService;

    // ── Student Endpoints ──────────────────────────────────────────────────────

    @Operation(summary = "Start proctoring session",
               description = "Captures reference face and creates a session. Idempotent — safe to call on page refresh.")
    @PostMapping("/start")
    public ResponseEntity<ProctorSession> startSession(
            @Valid @RequestBody StartProctoringRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        ProctorSession session = proctoringService.startSession(
                principal.getId(),
                request.getQuizId(),
                request.getReferenceImageBase64());

        // Do NOT return referenceImage bytes in API response (bandwidth + security)
        session.setReferenceImage(null);
        return ResponseEntity.ok(session);
    }

    @Operation(summary = "Analyze webcam frame",
               description = "Send a webcam frame (Base64) or a client-side violation type for logging.")
    @PostMapping("/analyze")
    public ResponseEntity<ProctoringResultResponse> analyzeFrame(
            @Valid @RequestBody AnalyzeFrameRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        ProctoringResultResponse result = proctoringService.analyzeFrame(
                principal.getId(),
                request.getQuizId(),
                request.getImageBase64(),
                request.getClientViolationType());

        return ResponseEntity.ok(result);
    }

    @Operation(summary = "End proctoring session",
               description = "Marks the session as COMPLETED when the student submits the quiz.")
    @PostMapping("/end")
    public ResponseEntity<Void> endSession(
            @RequestParam Long quizId,
            @AuthenticationPrincipal UserPrincipal principal) {

        proctoringService.endSession(principal.getId(), quizId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get session status",
               description = "Returns the current warning count and session status.")
    @GetMapping("/session/{quizId}")
    public ResponseEntity<ProctoringResultResponse> getSessionStatus(
            @PathVariable Long quizId,
            @AuthenticationPrincipal UserPrincipal principal) {

        ProctorSession session = proctoringService.getSession(principal.getId(), quizId);
        boolean terminated = session.getStatus() == com.tukaram.kasoti.model.ProctoringStatus.TERMINATED;

        return ResponseEntity.ok(ProctoringResultResponse.builder()
                .status(terminated ? "EXAM_TERMINATED" : session.getStatus().name())
                .warningCount(session.getWarningCount())
                .warningLimit(session.getWarningLimit())
                .terminated(terminated)
                .build());
    }

    // ── Teacher / Admin Endpoints ──────────────────────────────────────────────

    @Operation(summary = "Get violation log for a session",
               description = "Returns all logged violations for a proctoring session (Teacher/Admin only).")
    @GetMapping("/violations/{sessionId}")
    public ResponseEntity<List<ViolationLogDTO>> getViolations(@PathVariable Long sessionId) {
        return ResponseEntity.ok(proctoringService.getViolations(sessionId));
    }
}
