package com.tukaram.kasoti.service;

import com.tukaram.kasoti.dto.DashboardStatsDTO;
import com.tukaram.kasoti.dto.QuizStatisticsDTO;
import com.tukaram.kasoti.exception.ResourceNotFoundException;
import com.tukaram.kasoti.model.Quiz;
import com.tukaram.kasoti.model.QuizAttempt;
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
     * Note: attemptCount and averageScore trigger 2 queries per quiz.
     * For large datasets, consider a single aggregation query.
     */
    public Page<QuizStatisticsDTO> getTeacherQuizzesWithStats(Long teacherId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return quizRepository.findByCreatedById(teacherId, pageable)
                .map(this::convertToStatisticsDTO);
    }

    /**
     * Get recent attempts on teacher's quizzes.
     */
    public List<QuizAttempt> getRecentAttempts(Long teacherId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return quizAttemptRepository.findByQuizCreatedById(teacherId, pageable).getContent();
    }

    /**
     * Get statistics for a specific quiz.
     */
    public QuizStatisticsDTO getQuizStatistics(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));
        return convertToStatisticsDTO(quiz);
    }

    // ========== Helper Methods ==========

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
