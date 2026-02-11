package com.tukaram.kasoti.service;

import com.tukaram.kasoti.dto.*;
import com.tukaram.kasoti.exception.BadRequestException;
import com.tukaram.kasoti.exception.ResourceNotFoundException;
import com.tukaram.kasoti.model.Quiz;
import com.tukaram.kasoti.model.QuizAttempt;
import com.tukaram.kasoti.model.QuizStatus;
import com.tukaram.kasoti.model.Role;
import com.tukaram.kasoti.model.User;
import com.tukaram.kasoti.repository.QuizAttemptRepository;
import com.tukaram.kasoti.repository.QuizRepository;
import com.tukaram.kasoti.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for admin-only operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
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

    @Transactional(readOnly = false)
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

    @Transactional(readOnly = false)
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

    @Transactional(readOnly = false)
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
        QuizAttempt attempt = quizAttemptRepository.findByIdWithDetails(attemptId)
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
