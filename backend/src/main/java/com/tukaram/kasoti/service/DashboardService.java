package com.tukaram.kasoti.service;

import com.tukaram.kasoti.dto.AttemptSummaryDTO;
import com.tukaram.kasoti.dto.DashboardStatsDTO;
import com.tukaram.kasoti.dto.QuizStatisticsDTO;
import com.tukaram.kasoti.exception.ResourceNotFoundException;
import com.tukaram.kasoti.model.Quiz;
import com.tukaram.kasoti.model.QuizStatus;
import com.tukaram.kasoti.repository.QuizAttemptRepository;
import com.tukaram.kasoti.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for teacher dashboard operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    /**
     * Get teacher's dashboard statistics.
     * Uses COUNT/AVG queries — no entity loading, very efficient.
     */
    public DashboardStatsDTO getTeacherStats(Long teacherId) {
        return DashboardStatsDTO.builder()
                .totalQuizzes(quizRepository.countByCreatedById(teacherId))
                .publishedQuizzes(quizRepository.countByCreatedByIdAndStatus(teacherId, QuizStatus.PUBLISHED))
                .draftQuizzes(quizRepository.countByCreatedByIdAndStatus(teacherId, QuizStatus.DRAFT))
                .closedQuizzes(quizRepository.countByCreatedByIdAndStatus(teacherId, QuizStatus.CLOSED))
                .totalAttempts(quizAttemptRepository.countByQuizCreatedById(teacherId))
                .averageScore(quizAttemptRepository.findAverageScoreByTeacherId(teacherId))
                .build();
    }

    /**
     * Get teacher's quizzes with statistics (paginated).
     * Uses batch aggregation query to prevent N+1 per-quiz DB calls.
     */
    public Page<QuizStatisticsDTO> getTeacherQuizzesWithStats(Long teacherId, int page, int size) {
        size = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(Math.max(0, page), size, Sort.by("id").descending());
        Page<Quiz> quizPage = quizRepository.findByCreatedById(teacherId, pageable);

        // Batch-fetch attempt stats for all quizzes on this page in ONE query
        List<Long> quizIds = quizPage.getContent().stream().map(Quiz::getId).toList();
        Map<Long, long[]> statsMap = getAttemptStatsMap(quizIds);

        return quizPage.map(quiz -> {
            long[] stats = statsMap.getOrDefault(quiz.getId(), new long[]{0, 0});
            return QuizStatisticsDTO.builder()
                    .id(quiz.getId())
                    .title(quiz.getTitle())
                    .description(quiz.getDescription())
                    .category(quiz.getCategory())
                    .status(quiz.getStatus())
                    .shareCode(quiz.getShareCode())
                    .questionCount(quiz.getQuestions() != null ? quiz.getQuestions().size() : 0)
                    .totalMarks(quiz.getTotalMarks())
                    .attemptCount(stats[0])
                    .averageScore(stats[1] == 0 ? null : (double) stats[1])
                    .build();
        });
    }

    /**
     * Get recent attempts on teacher's quizzes.
     */
    public List<AttemptSummaryDTO> getRecentAttempts(Long teacherId, int limit) {
        limit = Math.max(1, Math.min(limit, 100)); // L4: cap limit
        Pageable pageable = PageRequest.of(0, limit);
        return quizAttemptRepository.findByQuizCreatedByIdWithUserAndQuiz(teacherId, pageable).getContent().stream()
                .map(attempt -> AttemptSummaryDTO.builder()
                        .attemptId(attempt.getId())
                        .username(attempt.getUser().getUsername())
                        .quizId(attempt.getQuiz().getId())
                        .quizTitle(attempt.getQuiz().getTitle())
                        .quizCategory(attempt.getQuiz().getCategory())
                        .score(attempt.getScore())
                        .marksObtained(attempt.getMarksObtained())
                        .totalMarks(attempt.getTotalMarks())
                        .correctAnswers(attempt.getCorrectAnswers())
                        .totalQuestions(attempt.getTotalQuestions())
                        .timeTakenSeconds(attempt.getTimeTakenSeconds())
                        .attemptedAt(attempt.getAttemptedAt())
                        .build())
                .toList();
    }

    /**
     * Get statistics for a specific quiz.
     * Requires ownership check — caller must verify.
     */
    public QuizStatisticsDTO getQuizStatistics(Long quizId, Long teacherId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        // M2: IDOR fix — verify ownership
        if (!quiz.getCreatedBy().getId().equals(teacherId)) {
            throw new com.tukaram.kasoti.exception.ForbiddenException(
                    "You can only view statistics for your own quizzes");
        }

        return convertToStatisticsDTO(quiz);
    }

    // ========== Helper Methods ==========

    /**
     * Batch-fetch attempt count and average score for all given quiz IDs.
     * Returns map: quizId → [count, avgScore * 100 (as long)].
     */
    private Map<Long, long[]> getAttemptStatsMap(List<Long> quizIds) {
        if (quizIds.isEmpty()) return Map.of();
        return quizAttemptRepository.findStatsForQuizIds(quizIds).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> new long[]{(Long) row[1],
                                row[2] != null ? Math.round((Double) row[2]) : 0}
                ));
    }

    private QuizStatisticsDTO convertToStatisticsDTO(Quiz quiz) {
        Long quizId = quiz.getId();
        return QuizStatisticsDTO.builder()
                .id(quizId)
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .category(quiz.getCategory())
                .status(quiz.getStatus())
                .shareCode(quiz.getShareCode())
                .questionCount(quiz.getQuestions() != null ? quiz.getQuestions().size() : 0)
                .totalMarks(quiz.getTotalMarks())
                .attemptCount(quizAttemptRepository.countByQuizId(quizId))
                .averageScore(quizAttemptRepository.findAverageScoreByQuizId(quizId))
                .build();
    }
}
