package com.tukaram.kasoti.controller;

import com.tukaram.kasoti.dto.AttemptSummaryDTO;
import com.tukaram.kasoti.dto.DashboardStatsDTO;
import com.tukaram.kasoti.dto.QuizAnalyticsDTO;
import com.tukaram.kasoti.dto.QuizStatisticsDTO;
import com.tukaram.kasoti.security.UserPrincipal;
import com.tukaram.kasoti.service.AnalyticsService;
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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Controller for teacher dashboard operations.
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Teacher dashboard statistics")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AnalyticsService analyticsService;

    @Operation(summary = "Get dashboard stats", description = "Returns summary stats for the teacher's quizzes")
    @ApiResponse(responseCode = "200", description = "Dashboard statistics")
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getTeacherStats(principal.getId()));
    }

    @Operation(summary = "Get quizzes with stats", description = "Paginated list of teacher's quizzes with attempt statistics")
    @ApiResponse(responseCode = "200", description = "Page of quiz statistics")
    @GetMapping("/quizzes")
    public ResponseEntity<Page<QuizStatisticsDTO>> getQuizzesWithStats(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(dashboardService.getTeacherQuizzesWithStats(principal.getId(), page, size));
    }

    @Operation(summary = "Get single quiz stats", description = "Detailed statistics for a specific quiz")
    @ApiResponse(responseCode = "200", description = "Quiz statistics")
    @GetMapping("/quizzes/{id}/stats")
    public ResponseEntity<QuizStatisticsDTO> getQuizStats(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getQuizStatistics(id, principal.getId()));
    }

    @Operation(summary = "Get recent attempts", description = "List recent quiz attempts across the teacher's quizzes")
    @ApiResponse(responseCode = "200", description = "List of recent attempts")
    @GetMapping("/recent-attempts")
    public ResponseEntity<List<AttemptSummaryDTO>> getRecentAttempts(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(dashboardService.getRecentAttempts(principal.getId(), limit));
    }

    @Operation(summary = "Get quiz analytics", description = "Question-level analytics for a specific quiz")
    @ApiResponse(responseCode = "200", description = "Quiz analytics with per-question breakdowns")
    @GetMapping("/quizzes/{id}/analytics")
    public ResponseEntity<QuizAnalyticsDTO> getQuizAnalytics(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(analyticsService.getQuizAnalytics(id, principal.getId()));
    }
}
