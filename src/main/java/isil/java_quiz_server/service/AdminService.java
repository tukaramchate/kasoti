package isil.java_quiz_server.service;

import isil.java_quiz_server.dto.*;
import isil.java_quiz_server.exception.BadRequestException;
import isil.java_quiz_server.exception.ResourceNotFoundException;
import isil.java_quiz_server.model.Quiz;
import isil.java_quiz_server.model.QuizAttempt;
import isil.java_quiz_server.model.QuizStatus;
import isil.java_quiz_server.model.Role;
import isil.java_quiz_server.model.User;
import isil.java_quiz_server.repository.QuizAttemptRepository;
import isil.java_quiz_server.repository.QuizRepository;
import isil.java_quiz_server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;

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
        return convertToAdminDTO(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

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
        return SystemStatsDTO.builder()
                .totalUsers(userRepository.count())
                .totalAdmins(userRepository.countByRole(Role.ADMIN))
                .totalTeachers(userRepository.countByRole(Role.TEACHER))
                .totalStudents(userRepository.countByRole(Role.STUDENT))
                .totalQuizzes(quizRepository.count())
                .publishedQuizzes(quizRepository.countByStatus(QuizStatus.PUBLISHED))
                .draftQuizzes(quizRepository.countByStatus(QuizStatus.DRAFT))
                .closedQuizzes(quizRepository.countByStatus(QuizStatus.CLOSED))
                .totalAttempts(quizAttemptRepository.count())
                .build();
    }

    // ========== Attempt Management ==========

    public Page<DetailedAttemptDTO> getAllAttempts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("attemptedAt").descending());
        return quizAttemptRepository.findAll(pageable).map(this::convertToDetailedDTO);
    }

    public DetailedAttemptDTO getAttemptById(Long attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("QuizAttempt", "id", attemptId));
        return convertToDetailedDTO(attempt);
    }

    // ========== Helper Methods ==========

    private UserAdminDTO convertToAdminDTO(User user) {
        return UserAdminDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private DetailedAttemptDTO convertToDetailedDTO(QuizAttempt attempt) {
        return DetailedAttemptDTO.builder()
                .attemptId(attempt.getId())
                .quizId(attempt.getQuiz().getId())
                .quizTitle(attempt.getQuiz().getTitle())
                .userId(attempt.getUser().getId())
                .username(attempt.getUser().getUsername())
                .score(attempt.getScore())
                .marksObtained(attempt.getMarksObtained())
                .totalMarks(attempt.getTotalMarks())
                .correctAnswers(attempt.getCorrectAnswers())
                .totalQuestions(attempt.getTotalQuestions())
                .timeTakenSeconds(attempt.getTimeTakenSeconds())
                .attemptedAt(attempt.getAttemptedAt())
                .answers(attempt.getAnswers() != null
                        ? attempt.getAnswers().stream()
                                .map(a -> AnswerDTO.builder()
                                        .questionId(a.getQuestion().getId())
                                        .questionText(a.getQuestion().getText())
                                        .selectedOption(a.getSelectedOption())
                                        .correctOption(a.getQuestion().getCorrectOption())
                                        .isCorrect(a.getIsCorrect())
                                        .marksObtained(a.getMarksObtained())
                                        .maxMarks(a.getQuestion().getMarks())
                                        .build())
                                .toList()
                        : null)
                .build();
    }
}
