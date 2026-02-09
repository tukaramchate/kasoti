package isil.java_quiz_server.service;

import isil.java_quiz_server.dto.*;
import isil.java_quiz_server.exception.BadRequestException;
import isil.java_quiz_server.exception.ResourceNotFoundException;
import isil.java_quiz_server.model.Quiz;
import isil.java_quiz_server.model.QuizStatus;
import isil.java_quiz_server.model.Role;
import isil.java_quiz_server.model.User;
import isil.java_quiz_server.repository.QuizAttemptRepository;
import isil.java_quiz_server.repository.QuizRepository;
import isil.java_quiz_server.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for admin-only operations.
 */
@Service
public class AdminService {

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public AdminService(UserRepository userRepository,
            QuizRepository quizRepository,
            QuizAttemptRepository quizAttemptRepository) {
        this.userRepository = userRepository;
        this.quizRepository = quizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
    }

    // ========== User Management ==========

    public Page<UserAdminDTO> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return userRepository.findAll(pageable).map(this::convertToAdminDTO);
    }

    public Page<UserAdminDTO> getUsersByRole(Role role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return userRepository.findByRole(role, pageable).map(this::convertToAdminDTO);
    }

    public UserAdminDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return convertToAdminDTO(user);
    }

    @Transactional
    public UserAdminDTO updateUserRole(Long userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Prevent removing the last admin
        if (user.getRole() == Role.ADMIN && newRole != Role.ADMIN) {
            long adminCount = userRepository.countByRole(Role.ADMIN);
            if (adminCount <= 1) {
                throw new BadRequestException("Cannot remove the last admin. Create another admin first.");
            }
        }

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);
        return convertToAdminDTO(updatedUser);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Prevent deleting the last admin
        if (user.getRole() == Role.ADMIN) {
            long adminCount = userRepository.countByRole(Role.ADMIN);
            if (adminCount <= 1) {
                throw new BadRequestException("Cannot delete the last admin.");
            }
        }

        userRepository.delete(user);
    }

    // ========== Quiz Management ==========

    public Page<Quiz> getAllQuizzes(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return quizRepository.findAll(pageable);
    }

    @Transactional
    public void deleteQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));
        quizRepository.delete(quiz);
    }

    // ========== System Statistics ==========

    public SystemStatsDTO getSystemStats() {
        SystemStatsDTO stats = new SystemStatsDTO();

        stats.setTotalUsers(userRepository.count());
        stats.setTotalAdmins(userRepository.countByRole(Role.ADMIN));
        stats.setTotalTeachers(userRepository.countByRole(Role.TEACHER));
        stats.setTotalStudents(userRepository.countByRole(Role.STUDENT));
        stats.setTotalQuizzes(quizRepository.count());
        stats.setPublishedQuizzes(quizRepository.countByStatus(QuizStatus.PUBLISHED));
        stats.setDraftQuizzes(quizRepository.countByStatus(QuizStatus.DRAFT));
        stats.setClosedQuizzes(quizRepository.countByStatus(QuizStatus.CLOSED));
        stats.setTotalAttempts(quizAttemptRepository.count());

        return stats;
    }

    // ========== Helper Methods ==========

    private UserAdminDTO convertToAdminDTO(User user) {
        return new UserAdminDTO(
                user.getId(),
                user.getName(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }

    // ========== Attempt Management ==========

    public Page<DetailedAttemptDTO> getAllAttempts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("attemptedAt").descending());
        return quizAttemptRepository.findAll(pageable).map(this::convertToDetailedDTO);
    }

    public DetailedAttemptDTO getAttemptById(Long attemptId) {
        var attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("QuizAttempt", "id", attemptId));
        return convertToDetailedDTO(attempt);
    }

    private DetailedAttemptDTO convertToDetailedDTO(isil.java_quiz_server.model.QuizAttempt attempt) {
        DetailedAttemptDTO dto = new DetailedAttemptDTO();
        dto.setAttemptId(attempt.getId());
        dto.setQuizId(attempt.getQuiz().getId());
        dto.setQuizTitle(attempt.getQuiz().getTitle());
        dto.setUserId(attempt.getUser().getId());
        dto.setUsername(attempt.getUser().getUsername());
        dto.setScore(attempt.getScore());
        dto.setMarksObtained(attempt.getMarksObtained());
        dto.setTotalMarks(attempt.getTotalMarks());
        dto.setCorrectAnswers(attempt.getCorrectAnswers());
        dto.setTotalQuestions(attempt.getTotalQuestions());
        dto.setTimeTakenSeconds(attempt.getTimeTakenSeconds());
        dto.setAttemptedAt(attempt.getAttemptedAt());

        if (attempt.getAnswers() != null) {
            dto.setAnswers(attempt.getAnswers().stream()
                    .map(a -> new AnswerDTO(
                            a.getQuestion().getId(),
                            a.getQuestion().getText(),
                            a.getSelectedOption(),
                            a.getQuestion().getCorrectOption(),
                            a.getIsCorrect(),
                            a.getMarksObtained(),
                            a.getQuestion().getMarks()))
                    .toList());
        }

        return dto;
    }
}
