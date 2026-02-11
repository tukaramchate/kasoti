package com.tukaram.kasoti.controller;

import com.tukaram.kasoti.dto.DashboardStatsDTO;
import com.tukaram.kasoti.dto.QuizStatisticsDTO;
import com.tukaram.kasoti.model.QuizAttempt;
import com.tukaram.kasoti.security.UserPrincipal;
import com.tukaram.kasoti.service.DashboardService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import lombok.RequiredArgsConstructor;

/**
 * Controller for teacher dashboard operations.
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getTeacherStats(principal.getId()));
    }

    @GetMapping("/quizzes")
    public ResponseEntity<Page<QuizStatisticsDTO>> getQuizzesWithStats(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(dashboardService.getTeacherQuizzesWithStats(principal.getId(), page, size));
    }

    @GetMapping("/quizzes/{id}/stats")
    public ResponseEntity<QuizStatisticsDTO> getQuizStats(@PathVariable Long id) {
        return ResponseEntity.ok(dashboardService.getQuizStatistics(id));
    }

    @GetMapping("/recent-attempts")
    public ResponseEntity<List<QuizAttempt>> getRecentAttempts(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(dashboardService.getRecentAttempts(principal.getId(), limit));
    }
}
