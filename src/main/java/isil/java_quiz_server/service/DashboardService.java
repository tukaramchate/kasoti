package isil.java_quiz_server.service;

import isil.java_quiz_server.dto.DashboardStatsDTO;
import isil.java_quiz_server.dto.QuizStatisticsDTO;
import isil.java_quiz_server.model.Quiz;
import isil.java_quiz_server.model.QuizAttempt;
import isil.java_quiz_server.model.QuizStatus;
import isil.java_quiz_server.repository.QuizAttemptRepository;
import isil.java_quiz_server.repository.QuizRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for teacher dashboard operations.
 */
@Service
public class DashboardService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public DashboardService(QuizRepository quizRepository,
            QuizAttemptRepository quizAttemptRepository) {
        this.quizRepository = quizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
    }

    /**
     * Get teacher's dashboard statistics.
     */
    public DashboardStatsDTO getTeacherStats(Long teacherId) {
        DashboardStatsDTO stats = new DashboardStatsDTO();

        stats.setTotalQuizzes(quizRepository.countByCreatedById(teacherId));
        stats.setPublishedQuizzes(quizRepository.countByCreatedByIdAndStatus(teacherId, QuizStatus.PUBLISHED));
        stats.setDraftQuizzes(quizRepository.countByCreatedByIdAndStatus(teacherId, QuizStatus.DRAFT));
        stats.setClosedQuizzes(quizRepository.countByCreatedByIdAndStatus(teacherId, QuizStatus.CLOSED));
        stats.setTotalAttempts(quizAttemptRepository.countByQuizCreatedById(teacherId));
        stats.setAverageScore(quizAttemptRepository.findAverageScoreByTeacherId(teacherId));

        return stats;
    }

    /**
     * Get teacher's quizzes with statistics.
     */
    public List<QuizStatisticsDTO> getTeacherQuizzesWithStats(Long teacherId) {
        List<Quiz> quizzes = quizRepository.findByCreatedById(teacherId);
        return quizzes.stream()
                .map(this::convertToStatisticsDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get teacher's quizzes with statistics (paginated).
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
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        return convertToStatisticsDTO(quiz);
    }

    // ========== Helper Methods ==========

    private QuizStatisticsDTO convertToStatisticsDTO(Quiz quiz) {
        QuizStatisticsDTO dto = new QuizStatisticsDTO();
        dto.setId(quiz.getId());
        dto.setTitle(quiz.getTitle());
        dto.setDescription(quiz.getDescription());
        dto.setCategory(quiz.getCategory());
        dto.setStatus(quiz.getStatus());
        dto.setShareCode(quiz.getShareCode());
        dto.setQuestionCount(quiz.getQuestions() != null ? quiz.getQuestions().size() : 0);
        dto.setTotalMarks(quiz.getTotalMarks());
        dto.setAttemptCount(quizAttemptRepository.countByQuizId(quiz.getId()));
        dto.setAverageScore(quizAttemptRepository.findAverageScoreByQuizId(quiz.getId()));
        return dto;
    }
}
