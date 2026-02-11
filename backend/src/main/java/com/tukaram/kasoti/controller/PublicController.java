package com.tukaram.kasoti.controller;

import com.tukaram.kasoti.dto.QuizDTO;
import com.tukaram.kasoti.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * Public controller for unauthenticated access to shared quizzes.
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final QuizService quizService;

    /**
     * Get quiz by share code - no authentication required.
     * Users can preview the quiz before logging in to submit.
     */
    @GetMapping("/quizzes/share/{shareCode}")
    public ResponseEntity<QuizDTO> getQuizByShareCode(@PathVariable String shareCode) {
        return ResponseEntity.ok(quizService.getQuizByShareCode(shareCode));
    }
}
