package isil.java_quiz_server.controller;

import isil.java_quiz_server.dto.PublishQuizResponse;
import isil.java_quiz_server.dto.QuizDTO;
import isil.java_quiz_server.dto.QuizResultResponse;
import isil.java_quiz_server.dto.SubmitQuizRequest;
import isil.java_quiz_server.model.Quiz;
import isil.java_quiz_server.model.QuizAttempt;
import isil.java_quiz_server.security.UserPrincipal;
import isil.java_quiz_server.service.QuizService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    // ========== Public Endpoints ==========

    @GetMapping
    public ResponseEntity<Page<QuizDTO>> getQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
        if (search != null && category != null) {
            return ResponseEntity.ok(quizService.searchQuizzesByCategory(search, category, page, size));
        } else if (search != null) {
            return ResponseEntity.ok(quizService.searchQuizzes(search, page, size));
        } else if (category != null) {
            return ResponseEntity.ok(quizService.getQuizzesByCategoryPaginated(category, page, size));
        }
        return ResponseEntity.ok(quizService.getQuizzesPaginated(page, size));
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
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.getQuizStudents(id, principal));
    }
}
