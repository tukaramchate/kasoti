package isil.java_quiz_server.controller;

import isil.java_quiz_server.dto.QuizResultResponse;
import isil.java_quiz_server.dto.SubmitQuizRequest;
import isil.java_quiz_server.model.Quiz;
import isil.java_quiz_server.model.QuizAttempt;
import isil.java_quiz_server.security.UserPrincipal;
import isil.java_quiz_server.service.QuizService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" })
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping
    public List<Quiz> getAllQuizzes() {
        return quizService.getAllQuizzes();
    }

    @GetMapping("/category/{category}")
    public List<Quiz> getQuizzesByCategory(@PathVariable String category) {
        return quizService.getQuizzesByCategory(category);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quiz> getQuizById(@PathVariable Long id) {
        Quiz quiz = quizService.getQuizById(id);
        return ResponseEntity.ok(quiz);
    }

    @GetMapping("/my")
    public List<Quiz> getMyQuizzes(@AuthenticationPrincipal UserPrincipal principal) {
        return quizService.getQuizzesByUsername(principal.getUsername());
    }

    @PostMapping
    public ResponseEntity<Quiz> createQuiz(@Valid @RequestBody Quiz quiz,
            @AuthenticationPrincipal UserPrincipal principal) {
        Quiz createdQuiz = quizService.createQuiz(quiz, principal);
        return new ResponseEntity<>(createdQuiz, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Quiz> updateQuiz(@PathVariable Long id,
            @Valid @RequestBody Quiz quiz,
            @AuthenticationPrincipal UserPrincipal principal) {
        Quiz updatedQuiz = quizService.updateQuiz(id, quiz, principal);
        return ResponseEntity.ok(updatedQuiz);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        quizService.deleteQuiz(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<QuizResultResponse> submitQuiz(@PathVariable Long id,
            @Valid @RequestBody SubmitQuizRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        QuizResultResponse result = quizService.submitQuiz(id, request, principal);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/leaderboard")
    public List<QuizAttempt> getQuizLeaderboard(@PathVariable Long id) {
        return quizService.getQuizLeaderboard(id);
    }

    @GetMapping("/{id}/attempted")
    public ResponseEntity<Boolean> hasUserAttempted(@PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean attempted = quizService.hasUserAttempted(principal.getId(), id);
        return ResponseEntity.ok(attempted);
    }

    @GetMapping("/{id}/students")
    public List<QuizAttempt> getQuizStudents(@PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return quizService.getQuizStudents(id, principal.getUsername());
    }
}
