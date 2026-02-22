package com.tukaram.kasoti.controller;

import com.tukaram.kasoti.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Controller for category and tag operations.
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Quiz categories and tags")
public class CategoryController {

    private final QuizService quizService;

    @Operation(summary = "Get all categories", description = "List all unique quiz categories")
    @ApiResponse(responseCode = "200", description = "List of category names")
    @GetMapping
    public ResponseEntity<List<String>> getAllCategories() {
        return ResponseEntity.ok(quizService.getAllCategories());
    }

    @Operation(summary = "Get all tags", description = "List all unique quiz tags")
    @ApiResponse(responseCode = "200", description = "List of tags")
    @GetMapping("/tags")
    public ResponseEntity<List<String>> getAllTags() {
        return ResponseEntity.ok(quizService.getAllTags());
    }
}
