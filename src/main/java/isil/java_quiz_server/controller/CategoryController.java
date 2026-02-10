package isil.java_quiz_server.controller;

import isil.java_quiz_server.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller for category and tag operations.
 */
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final QuizService quizService;

    public CategoryController(QuizService quizService) {
        this.quizService = quizService;
    }

    /**
     * Get all unique categories from published quizzes.
     */
    @GetMapping
    public ResponseEntity<List<String>> getAllCategories() {
        return ResponseEntity.ok(quizService.getAllCategories());
    }

    /**
     * Get all unique tags from published quizzes.
     */
    @GetMapping("/tags")
    public ResponseEntity<List<String>> getAllTags() {
        return ResponseEntity.ok(quizService.getAllTags());
    }
}
