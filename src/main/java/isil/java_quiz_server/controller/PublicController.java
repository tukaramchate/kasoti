package isil.java_quiz_server.controller;

import isil.java_quiz_server.dto.QuizDTO;
import isil.java_quiz_server.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public controller for unauthenticated access to shared quizzes.
 * Allows users to preview quizzes without logging in.
 */
@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final QuizService quizService;

    public PublicController(QuizService quizService) {
        this.quizService = quizService;
    }

    /**
     * Get quiz by share code - no authentication required.
     * Users can preview the quiz before logging in to submit.
     */
    @GetMapping("/quizzes/share/{shareCode}")
    public ResponseEntity<QuizDTO> getQuizByShareCode(@PathVariable String shareCode) {
        return ResponseEntity.ok(quizService.getQuizByShareCode(shareCode));
    }
}
