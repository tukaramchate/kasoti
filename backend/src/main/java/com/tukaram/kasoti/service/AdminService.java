package com.tukaram.kasoti.service;

import com.tukaram.kasoti.dto.*;
import com.tukaram.kasoti.exception.BadRequestException;
import com.tukaram.kasoti.exception.ResourceNotFoundException;
import com.tukaram.kasoti.model.Quiz;
import com.tukaram.kasoti.model.QuestionType;
import com.tukaram.kasoti.model.QuizAttempt;
import com.tukaram.kasoti.model.QuizStatus;
import com.tukaram.kasoti.model.Role;
import com.tukaram.kasoti.model.User;
import com.tukaram.kasoti.repository.AnswerRepository;
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

import java.util.List;

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
    private final AnswerRepository answerRepository;

    private static final int MAX_PAGE_SIZE = 100;

    // ========== User Management ==========

    public Page<UserAdminDTO> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), capSize(size), Sort.by("id").descending());
        return userRepository.findAll(pageable).map(this::convertToAdminDTO);
    }

    public Page<UserAdminDTO> getUsersByRole(Role role, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), capSize(size), Sort.by("id").descending());
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
    public void deleteUser(Long userId, Long callingAdminId) {
        // M3: Prevent admin from deleting themselves
        if (userId.equals(callingAdminId)) {
            throw new BadRequestException("Cannot delete your own account.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() == Role.ADMIN) {
            long adminCount = userRepository.countByRole(Role.ADMIN);
            if (adminCount <= 1) {
                throw new BadRequestException("Cannot delete the last admin.");
            }
        }

        // Delete ElementCollection rows first, then answers, then attempts, then user
        answerRepository.deleteSelectedOptionsByUserId(userId);
        answerRepository.deleteAllByUserId(userId);
        quizAttemptRepository.deleteAllByUserId(userId);

        // If user is a teacher, clean up their quizzes' attempts too
        if (user.getRole() == Role.TEACHER) {
            List<Quiz> quizzes = quizRepository.findByCreatedById(userId);
            for (Quiz quiz : quizzes) {
                answerRepository.deleteSelectedOptionsByQuizId(quiz.getId());
                answerRepository.deleteAllByQuizId(quiz.getId());
                quizAttemptRepository.deleteAllByQuizId(quiz.getId());
            }
            quizRepository.deleteAll(quizzes);
        }

        userRepository.delete(user);
    }

    // ========== Quiz Management ==========

    public Page<Quiz> getAllQuizzes(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), capSize(size), Sort.by("id").descending());
        return quizRepository.findAll(pageable);
    }

    @Transactional(readOnly = false)
    public void deleteQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        // Delete ElementCollection rows first, then answers, then attempts, then quiz
        answerRepository.deleteSelectedOptionsByQuizId(quizId);
        answerRepository.deleteAllByQuizId(quizId);
        quizAttemptRepository.deleteAllByQuizId(quizId);
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
        Pageable pageable = PageRequest.of(Math.max(0, page), capSize(size));
        return quizAttemptRepository.findAllWithUserAndQuiz(pageable).map(this::convertToDetailedDTO);
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

    private int capSize(int size) {
        return Math.max(1, Math.min(size, MAX_PAGE_SIZE));
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
                                .map(a -> {
                                    QuestionType type = a.getQuestion().getQuestionType() != null
                                            ? a.getQuestion().getQuestionType()
                                            : QuestionType.MCQ;
                                    return AnswerDTO.builder()
                                            .id(a.getId())
                                            .questionId(a.getQuestion().getId())
                                            .questionText(a.getQuestion().getText())
                                            .questionType(type)
                                            .selectedOption(a.getSelectedOption())
                                            .correctOption(a.getQuestion().getCorrectOption())
                                            .selectedOptions(a.getSelectedOptions())
                                            .correctOptions(a.getQuestion().getCorrectOptions())
                                            .textAnswer(a.getTextAnswer())
                                            .modelAnswer(a.getQuestion().getModelAnswer())
                                            .isCorrect(a.getIsCorrect())
                                            .marksObtained(a.getMarksObtained())
                                            .maxMarks(a.getQuestion().getMarks())
                                            .evaluationStatus(a.getEvaluationStatus())
                                            .evaluationComment(a.getEvaluationComment())
                                            .build();
                                })
                                .toList()
                        : null)
                .build();
    }
}
