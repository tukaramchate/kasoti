package com.tukaram.kasoti.controller;

import com.tukaram.kasoti.dto.AnswerDTO;
import com.tukaram.kasoti.dto.CreateQuizRequest;
import com.tukaram.kasoti.dto.EvaluateAnswerRequest;
import com.tukaram.kasoti.dto.LeaderboardEntryDTO;
import com.tukaram.kasoti.dto.PublishQuizResponse;
import com.tukaram.kasoti.dto.QuizDTO;
import com.tukaram.kasoti.dto.QuizResultResponse;
import com.tukaram.kasoti.dto.QuizSummaryDTO;
import com.tukaram.kasoti.dto.SubmitQuizRequest;
import com.tukaram.kasoti.model.Quiz;
import com.tukaram.kasoti.security.UserPrincipal;
import com.tukaram.kasoti.service.EvaluationService;
import com.tukaram.kasoti.service.ExportService;
import com.tukaram.kasoti.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Quizzes", description = "Quiz CRUD, publishing, sharing, and submission")
public class QuizController {

    private final QuizService quizService;
    private final ExportService exportService;
    private final EvaluationService evaluationService;

    // ========== Public Endpoints ==========

    @Operation(summary = "List quizzes", description = "Get published quizzes with pagination and optional filters (search, category, difficulty, tags)")
    @ApiResponse(responseCode = "200", description = "Page of quiz summaries")
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

    @Operation(summary = "Get quiz by ID", description = "Returns full quiz details including questions")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quiz found"),
            @ApiResponse(responseCode = "404", description = "Quiz not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<QuizDTO> getQuizById(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizByIdDTO(id));
    }

    @Operation(summary = "Get quiz by share code", description = "Look up a quiz using its unique share code")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quiz found"),
            @ApiResponse(responseCode = "404", description = "Invalid share code")
    })
    @GetMapping("/share/{shareCode}")
    public ResponseEntity<QuizDTO> getQuizByShareCode(@PathVariable String shareCode) {
        return ResponseEntity.ok(quizService.getQuizByShareCode(shareCode));
    }

    @Operation(summary = "Get quiz leaderboard", description = "Returns ranked list of top scorers for a quiz")
    @ApiResponse(responseCode = "200", description = "Leaderboard entries")
    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboard(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizLeaderboard(id));
    }

    // ========== Student Endpoints ==========

    @Operation(summary = "Check if user attempted quiz", description = "Returns whether the authenticated user has already attempted this quiz")
    @ApiResponse(responseCode = "200", description = "Attempt status")
    @GetMapping("/{id}/attempted")
    public ResponseEntity<Map<String, Boolean>> hasAttempted(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean attempted = quizService.hasUserAttempted(principal.getId(), id);
        return ResponseEntity.ok(Map.of("attempted", attempted));
    }

    @Operation(summary = "Submit quiz answers", description = "Submit answers for a quiz attempt. Each quiz can only be attempted once.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quiz submitted, results returned"),
            @ApiResponse(responseCode = "400", description = "Quiz already attempted or not published"),
            @ApiResponse(responseCode = "404", description = "Quiz not found")
    })
    @PostMapping("/{id}/submit")
    public ResponseEntity<QuizResultResponse> submitQuiz(
            @PathVariable Long id,
            @Valid @RequestBody SubmitQuizRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.submitQuiz(id, request, principal));
    }

    // ========== Teacher Endpoints ==========

    @Operation(summary = "Get my quizzes", description = "Returns all quizzes created by the authenticated teacher")
    @ApiResponse(responseCode = "200", description = "List of teacher's quizzes")
    @GetMapping("/my")
    public ResponseEntity<List<Quiz>> getMyQuizzes(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.getQuizzesByCreator(principal.getId()));
    }

    @Operation(summary = "Create a quiz", description = "Create a new quiz with questions. Only TEACHER and ADMIN roles.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Quiz created"),
            @ApiResponse(responseCode = "400", description = "Invalid quiz data")
    })
    @PostMapping
    public ResponseEntity<Quiz> createQuiz(
            @Valid @RequestBody CreateQuizRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.createQuiz(request, principal));
    }

    @Operation(summary = "Update a quiz", description = "Update an existing quiz. Only the creator can update.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quiz updated"),
            @ApiResponse(responseCode = "403", description = "Not the quiz creator"),
            @ApiResponse(responseCode = "404", description = "Quiz not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Quiz> updateQuiz(
            @PathVariable Long id,
            @Valid @RequestBody CreateQuizRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.updateQuiz(id, request, principal));
    }

    @Operation(summary = "Delete a quiz", description = "Delete a quiz and all its data. Only the creator can delete.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Quiz deleted"),
            @ApiResponse(responseCode = "403", description = "Not the quiz creator"),
            @ApiResponse(responseCode = "404", description = "Quiz not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        quizService.deleteQuiz(id, principal);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Publish a quiz", description = "Publish a draft quiz to make it available to students. Generates a share code.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quiz published with share code"),
            @ApiResponse(responseCode = "400", description = "Quiz already published or has no questions")
    })
    @PostMapping("/{id}/publish")
    public ResponseEntity<PublishQuizResponse> publishQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.publishQuiz(id, principal));
    }

    @Operation(summary = "Close a quiz", description = "Close a published quiz so no more submissions are accepted")
    @ApiResponse(responseCode = "200", description = "Quiz closed")
    @PostMapping("/{id}/close")
    public ResponseEntity<Quiz> closeQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.closeQuiz(id, principal));
    }

    @Operation(summary = "Update quiz status", description = "Update the status of a quiz")
    @PutMapping("/{id}/status")
    public ResponseEntity<Quiz> updateQuizStatus(
            @PathVariable Long id,
            @RequestParam com.tukaram.kasoti.model.QuizStatus status,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.updateQuizStatus(id, status, principal));
    }

    @Operation(summary = "Get quiz students", description = "List all students who attempted a quiz with their scores. Teacher/Admin only.")
    @ApiResponse(responseCode = "200", description = "List of student results")
    @GetMapping("/{id}/students")
    public ResponseEntity<List<LeaderboardEntryDTO>> getQuizStudents(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "score_desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.getQuizStudents(id, principal, sort));
    }

    // ========== Export Endpoints ==========

    @Operation(summary = "Export quiz as JSON", description = "Download the quiz data as a JSON file. Only the quiz creator can export.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "JSON file download"),
            @ApiResponse(responseCode = "403", description = "Not the quiz creator")
    })
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

    @Operation(summary = "Export attempts as CSV", description = "Download all student attempts for a quiz as a CSV file. Only the quiz creator can export.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "CSV file download"),
            @ApiResponse(responseCode = "403", description = "Not the quiz creator")
    })
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

    // ========== DESCRIPTIVE Answer Evaluation Endpoints ==========

    @Operation(summary = "Get pending evaluations", description = "List all unevaluated descriptive answers for a quiz. Teacher/Admin only.")
    @ApiResponse(responseCode = "200", description = "List of pending answers")
    @GetMapping("/{id}/pending-evaluations")
    public ResponseEntity<List<AnswerDTO>> getPendingEvaluations(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(evaluationService.getPendingAnswers(id, principal));
    }

    @Operation(summary = "Evaluate a descriptive answer", description = "Assign marks and optional comment to a descriptive answer. Teacher/Admin only.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Answer evaluated"),
            @ApiResponse(responseCode = "404", description = "Answer not found")
    })
    @PutMapping("/answers/{answerId}/evaluate")
    public ResponseEntity<AnswerDTO> evaluateAnswer(
            @PathVariable Long answerId,
            @Valid @RequestBody EvaluateAnswerRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(evaluationService.evaluateAnswer(
                answerId, request.getMarks(), request.getComment(), principal));
    }

}
