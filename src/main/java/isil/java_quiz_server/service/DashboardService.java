package isil.java_quiz_server.service;

import isil.java_quiz_server.dto.DashboardStatsDTO;
import isil.java_quiz_server.dto.QuizStatisticsDTO;
import isil.java_quiz_server.exception.ResourceNotFoundException;
import isil.java_quiz_server.model.Quiz;
import isil.java_quiz_server.model.QuizAttempt;
import isil.java_quiz_server.model.QuizStatus;
import isil.java_quiz_server.repository.QuizAttemptRepository;
import isil.java_quiz_server.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class DashboardService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    /**
     * Get teacher's dashboard statistics.
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
     * Get teacher's quizzes with statistics.
     */
    public List<QuizStatisticsDTO> getTeacherQuizzesWithStats(Long teacherId) {
        return quizRepository.findByCreatedById(teacherId).stream()
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
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));
        return convertToStatisticsDTO(quiz);
    }

    // ========== Helper Methods ==========

    private QuizStatisticsDTO convertToStatisticsDTO(Quiz quiz) {
        return QuizStatisticsDTO.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .category(quiz.getCategory())
                .status(quiz.getStatus())
                .shareCode(quiz.getShareCode())
                .questionCount(quiz.getQuestions() != null ? quiz.getQuestions().size() : 0)
                .totalMarks(quiz.getTotalMarks())
                .attemptCount(quizAttemptRepository.countByQuizId(quiz.getId()))
                .averageScore(quizAttemptRepository.findAverageScoreByQuizId(quiz.getId()))
                .build();
    }
}
