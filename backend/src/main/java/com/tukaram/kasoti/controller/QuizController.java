package com.tukaram.kasoti.controller;

import com.tukaram.kasoti.dto.PublishQuizResponse;
import com.tukaram.kasoti.dto.QuizDTO;
import com.tukaram.kasoti.dto.QuizResultResponse;
import com.tukaram.kasoti.dto.QuizSummaryDTO;
import com.tukaram.kasoti.dto.SubmitQuizRequest;
import com.tukaram.kasoti.model.Quiz;
import com.tukaram.kasoti.model.QuizAttempt;
import com.tukaram.kasoti.security.UserPrincipal;
import com.tukaram.kasoti.service.ExportService;
import com.tukaram.kasoti.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final ExportService exportService;

    // ========== Public Endpoints ==========

    /**
     * Get quizzes with pagination and optional filters.
     * All filters are optional — omitted filters are ignored.
     */
    @GetMapping
    public ResponseEntity<Page<QuizSummaryDTO>> getQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String tags) {
        return ResponseEntity.ok(quizService.findQuizzes(search, category, difficulty, tags, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizDTO> getQuizById(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizByIdDTO(id));
    }

    @GetMapping("/share/{shareCode}")
    public ResponseEntity<QuizDTO> getQuizByShareCode(@PathVariable String shareCode) {
        return ResponseEntity.ok(quizService.getQuizByShareCode(shareCode));
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<List<QuizAttempt>> getLeaderboard(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizLeaderboard(id));
    }

    // ========== Student Endpoints ==========

    @GetMapping("/{id}/attempted")
    public ResponseEntity<Map<String, Boolean>> hasAttempted(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean attempted = quizService.hasUserAttempted(principal.getId(), id);
        return ResponseEntity.ok(Map.of("attempted", attempted));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<QuizResultResponse> submitQuiz(
            @PathVariable Long id,
            @Valid @RequestBody SubmitQuizRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.submitQuiz(id, request, principal));
    }

    // ========== Teacher Endpoints ==========

    @GetMapping("/my")
    public ResponseEntity<List<Quiz>> getMyQuizzes(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.getQuizzesByCreator(principal.getId()));
    }

    @PostMapping
    public ResponseEntity<Quiz> createQuiz(
            @Valid @RequestBody Quiz quiz,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.createQuiz(quiz, principal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Quiz> updateQuiz(
            @PathVariable Long id,
            @Valid @RequestBody Quiz quizDetails,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.updateQuiz(id, quizDetails, principal));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        quizService.deleteQuiz(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<PublishQuizResponse> publishQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.publishQuiz(id, principal));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<Quiz> closeQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.closeQuiz(id, principal));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<List<QuizAttempt>> getQuizStudents(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "score_desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.getQuizStudents(id, principal, sort));
    }

    // ========== Export Endpoints ==========

    /**
     * Export a quiz as JSON file.
     * Only the quiz creator can export.
     */
    @GetMapping("/{id}/export")
    public ResponseEntity<String> exportQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) throws IOException {
        String jsonContent = exportService.exportQuizAsJson(id, principal);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDispositionFormData("attachment", "quiz-" + id + ".json");

        return ResponseEntity.ok()
                .headers(headers)
                .body(jsonContent);
    }

    /**
     * Export quiz attempts as CSV file.
     * Only the quiz creator can export attempts.
     */
    @GetMapping("/{id}/attempts/export")
    public ResponseEntity<String> exportAttempts(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        String csvContent = exportService.exportAttemptsAsCsv(id, principal);

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_TYPE, "text/csv");
        headers.setContentDispositionFormData("attachment", "quiz-" + id + "-attempts.csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvContent);
    }

}
