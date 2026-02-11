package com.tukaram.kasoti.service;

import com.tukaram.kasoti.dto.*;
import com.tukaram.kasoti.exception.BadRequestException;
import com.tukaram.kasoti.exception.ForbiddenException;
import com.tukaram.kasoti.exception.ResourceNotFoundException;
import com.tukaram.kasoti.model.*;
import com.tukaram.kasoti.repository.AnswerRepository;
import com.tukaram.kasoti.repository.QuizAttemptRepository;
import com.tukaram.kasoti.repository.QuizRepository;
import com.tukaram.kasoti.repository.UserRepository;
import com.tukaram.kasoti.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;

    private static final String SHARE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int SHARE_CODE_LENGTH = 8;
    private final SecureRandom secureRandom = new SecureRandom();

    // Sort strategies for quiz students — avoids verbose switch block
    private static final Map<String, Comparator<QuizAttempt>> SORT_STRATEGIES = Map.of(
            "score_desc", Comparator.comparingInt(QuizAttempt::getScore).reversed(),
            "score_asc", Comparator.comparingInt(QuizAttempt::getScore),
            "time_asc", Comparator.comparing(
                    a -> a.getTimeTakenSeconds() != null ? a.getTimeTakenSeconds() : Integer.MAX_VALUE),
            "attemptedAt_desc", Comparator.comparing(
                    QuizAttempt::getAttemptedAt, Comparator.nullsLast(Comparator.reverseOrder())));
    private static final Comparator<QuizAttempt> DEFAULT_SORT = Comparator.comparingInt(QuizAttempt::getScore)
            .reversed();

    // ========== DTO Conversion Methods ==========

    /**
     * Convert Quiz entity to QuizDTO (with questions, hides correct answers).
     */
    private QuizDTO convertToDTO(Quiz quiz) {
        List<QuestionDTO> questionDTOs = quiz.getQuestions().stream()
                .map(q -> QuestionDTO.builder()
                        .id(q.getId())
                        .text(q.getText())
                        .options(q.getOptions())
                        .build())
                .toList();

        return QuizDTO.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .username(quiz.getCreatedBy() != null ? quiz.getCreatedBy().getUsername() : null)
                .category(quiz.getCategory())
                .questions(questionDTOs)
                .build();
    }

    /**
     * Convert Quiz entity to QuizSummaryDTO (lightweight, no questions).
     */
    private QuizSummaryDTO convertToSummaryDTO(Quiz quiz) {
        return QuizSummaryDTO.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .category(quiz.getCategory())
                .status(quiz.getStatus())
                .creatorUsername(quiz.getCreatedBy() != null ? quiz.getCreatedBy().getUsername() : null)
                .questionCount(quiz.getQuestions() != null ? quiz.getQuestions().size() : 0)
                .totalMarks(quiz.getTotalMarks())
                .shareCode(quiz.getShareCode())
                .build();
    }

    /**
     * Get quiz by ID as DTO (for students - no correct answers).
     */
    public QuizDTO getQuizByIdDTO(Long id) {
        return convertToDTO(getQuizById(id));
    }

    /**
     * Get quiz by share code (public access).
     */
    public QuizDTO getQuizByShareCode(String shareCode) {
        Quiz quiz = quizRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "shareCode", shareCode));

        if (!quiz.isAvailable()) {
            throw new BadRequestException("This quiz is not currently available");
        }

        return convertToDTO(quiz);
    }

    // ========== Pagination Methods (Lightweight - No Questions) ==========

    /**
     * Unified search with all optional filters.
     * Replaces getQuizzesPaginated, getQuizzesByCategoryPaginated,
     * searchQuizzes, searchQuizzesByCategory, and searchQuizzesWithFilters.
     */
    public Page<QuizSummaryDTO> findQuizzes(String search, String category,
            String difficulty, String tags, int page, int size) {
        return quizRepository.findAvailableWithFilters(
                        blankToNull(search), blankToNull(category),
                        blankToNull(difficulty), blankToNull(tags),
                        LocalDateTime.now(), pageableDesc(page, size))
                .map(this::convertToSummaryDTO);
    }

    // Keep legacy methods delegating to unified search for backward compatibility

    public Page<QuizSummaryDTO> getQuizzesPaginated(int page, int size) {
        return findQuizzes(null, null, null, null, page, size);
    }

    public Page<QuizSummaryDTO> getQuizzesByCategoryPaginated(String category, int page, int size) {
        return findQuizzes(null, category, null, null, page, size);
    }

    public Page<QuizSummaryDTO> searchQuizzes(String search, int page, int size) {
        return findQuizzes(search, null, null, null, page, size);
    }

    public Page<QuizSummaryDTO> searchQuizzesByCategory(String search, String category, int page, int size) {
        return findQuizzes(search, category, null, null, page, size);
    }

    public Page<QuizSummaryDTO> searchQuizzesWithFilters(String search, String category,
            String difficulty, String tags, int page, int size) {
        return findQuizzes(search, category, difficulty, tags, page, size);
    }

    // ========== Teacher/Admin Quiz Management ==========

    public Quiz getQuizById(Long id) {
        return quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", id));
    }

    public List<Quiz> getQuizzesByCreator(Long creatorId) {
        return quizRepository.findByCreatedById(creatorId);
    }

    @Transactional
    public Quiz createQuiz(Quiz quiz, UserPrincipal principal) {
        if (!principal.isTeacherOrAdmin()) {
            throw new ForbiddenException("Only teachers and admins can create quizzes");
        }

        User creator = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        quiz.setCreatedBy(creator);
        quiz.setStatus(QuizStatus.DRAFT);
        return quizRepository.save(quiz);
    }

    @Transactional
    public Quiz updateQuiz(Long id, Quiz quizDetails, UserPrincipal principal) {
        Quiz quiz = getQuizById(id);
        validateOwnership(quiz, principal, "update");

        quiz.setTitle(quizDetails.getTitle());
        quiz.setDescription(quizDetails.getDescription());
        quiz.setCategory(quizDetails.getCategory());
        quiz.setTimeLimitMinutes(quizDetails.getTimeLimitMinutes());
        quiz.setStartTime(quizDetails.getStartTime());
        quiz.setEndTime(quizDetails.getEndTime());

        // Update questions — clear and re-add to handle orphan removal correctly
        if (quizDetails.getQuestions() != null) {
            quiz.getQuestions().clear();
            quiz.getQuestions().addAll(quizDetails.getQuestions());
        }

        return quizRepository.save(quiz);
    }

    @Transactional
    public void deleteQuiz(Long id, UserPrincipal principal) {
        Quiz quiz = getQuizById(id);
        validateOwnership(quiz, principal, "delete");
        quizRepository.delete(quiz);
    }

    // ========== Publish & Share ==========

    @Transactional
    public PublishQuizResponse publishQuiz(Long quizId, UserPrincipal principal) {
        Quiz quiz = getQuizById(quizId);
        validateOwnership(quiz, principal, "publish");

        if (quiz.getQuestions() == null || quiz.getQuestions().isEmpty()) {
            throw new BadRequestException("Cannot publish a quiz without questions");
        }

        if (quiz.getShareCode() == null) {
            quiz.setShareCode(generateUniqueShareCode());
        }

        quiz.setStatus(QuizStatus.PUBLISHED);
        quizRepository.save(quiz);

        String shareUrl = "/api/quizzes/share/" + quiz.getShareCode();
        return new PublishQuizResponse(quiz.getId(), quiz.getTitle(), quiz.getShareCode(), shareUrl);
    }

    @Transactional
    public Quiz closeQuiz(Long quizId, UserPrincipal principal) {
        Quiz quiz = getQuizById(quizId);
        validateOwnership(quiz, principal, "close");

        quiz.setStatus(QuizStatus.CLOSED);
        return quizRepository.save(quiz);
    }

    // ========== Quiz Submission ==========

    @Transactional
    public QuizResultResponse submitQuiz(Long quizId, SubmitQuizRequest request, UserPrincipal principal) {
        Quiz quiz = getQuizById(quizId);
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        // Validate submission eligibility
        if (principal.isTeacherOrAdmin()) {
            throw new ForbiddenException("Teachers and Admins cannot attempt quizzes");
        }
        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            throw new ForbiddenException(quiz.getStatus() == QuizStatus.CLOSED
                    ? "This quiz has been closed and is no longer accepting submissions"
                    : "This quiz is not available for submission");
        }
        if (!quiz.isAvailable()) {
            throw new ForbiddenException("This quiz is not currently available");
        }
        if (quizAttemptRepository.existsByUserIdAndQuizId(principal.getId(), quizId)) {
            throw new ForbiddenException("You have already attempted this quiz");
        }

        // Calculate score and track answers
        Map<Long, String> submittedAnswers = request.getAnswers();
        List<Answer> answers = new ArrayList<>();
        int correctCount = 0;
        int marksObtained = 0;
        int totalQuestions = quiz.getQuestions().size();
        int totalMarks = quiz.getTotalMarks();

        // Create attempt first
        QuizAttempt attempt = QuizAttempt.builder()
                .user(user)
                .quiz(quiz)
                .totalQuestions(totalQuestions)
                .totalMarks(totalMarks)
                .timeTakenSeconds(request.getTimeTakenSeconds())
                .build();

        for (Question question : quiz.getQuestions()) {
            String submittedAnswer = submittedAnswers.get(question.getId());
            boolean isCorrect = submittedAnswer != null && submittedAnswer.equals(question.getCorrectOption());
            int questionMarks = isCorrect ? (question.getMarks() != null ? question.getMarks() : 1) : 0;

            if (isCorrect) {
                correctCount++;
                marksObtained += questionMarks;
            }

            answers.add(Answer.builder()
                    .attempt(attempt)
                    .question(question)
                    .selectedOption(submittedAnswer)
                    .isCorrect(isCorrect)
                    .marksObtained(questionMarks)
                    .build());
        }

        int score = totalMarks > 0 ? (int) ((marksObtained * 100.0) / totalMarks) : 0;

        attempt.setScore(score);
        attempt.setCorrectAnswers(correctCount);
        attempt.setMarksObtained(marksObtained);
        attempt.setAnswers(answers);

        quizAttemptRepository.save(attempt);

        return new QuizResultResponse(
                quiz.getId(), quiz.getTitle(), correctCount,
                totalQuestions, request.getTimeTakenSeconds());
    }

    // ========== Quiz Attempt Queries ==========

    public boolean hasUserAttempted(Long userId, Long quizId) {
        return quizAttemptRepository.existsByUserIdAndQuizId(userId, quizId);
    }

    public List<QuizAttempt> getUserAttempts(Long userId) {
        return quizAttemptRepository.findByUserIdOrderByAttemptedAtDesc(userId);
    }

    public Page<QuizAttempt> getUserAttemptsPaginated(Long userId, int page, int size) {
        return quizAttemptRepository.findByUserIdOrderByAttemptedAtDesc(userId, PageRequest.of(page, size));
    }

    public List<QuizAttempt> getQuizLeaderboard(Long quizId) {
        return quizAttemptRepository.findLeaderboardByQuizId(quizId);
    }

    public List<QuizAttempt> getQuizStudents(Long quizId, UserPrincipal principal, String sort) {
        Quiz quiz = getQuizById(quizId);
        validateOwnership(quiz, principal, "view students for");

        List<QuizAttempt> attempts = quizAttemptRepository.findByQuizId(quizId);
        attempts.sort(sort != null ? SORT_STRATEGIES.getOrDefault(sort, DEFAULT_SORT) : DEFAULT_SORT);
        return attempts;
    }

    // ========== Category and Tag Methods ==========

    public List<String> getAllCategories() {
        return quizRepository.findAllCategories();
    }

    public List<String> getAllTags() {
        return quizRepository.findAllTags().stream()
                .flatMap(tagString -> java.util.Arrays.stream(tagString.split(",")))
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .distinct()
                .sorted()
                .toList();
    }

    // ========== Private Helpers ==========

    /**
     * Validates that the principal owns the quiz or is an admin.
     */
    private void validateOwnership(Quiz quiz, UserPrincipal principal, String action) {
        if (!principal.isAdmin() && !quiz.getCreatedBy().getId().equals(principal.getId())) {
            throw new ForbiddenException("You can only " + action + " your own quizzes");
        }
    }

    /**
     * Creates a standard descending pageable sorted by ID.
     */
    private Pageable pageableDesc(int page, int size) {
        return PageRequest.of(page, size, Sort.by("id").descending());
    }

    /**
     * Converts blank/empty strings to null for optional JPQL parameters.
     */
    private String blankToNull(String value) {
        return (value != null && !value.isBlank()) ? value : null;
    }

    private String generateUniqueShareCode() {
        String code;
        do {
            code = generateShareCode();
        } while (quizRepository.findByShareCode(code).isPresent());
        return code;
    }

    private String generateShareCode() {
        StringBuilder sb = new StringBuilder(SHARE_CODE_LENGTH);
        for (int i = 0; i < SHARE_CODE_LENGTH; i++) {
            sb.append(SHARE_CODE_CHARS.charAt(secureRandom.nextInt(SHARE_CODE_CHARS.length())));
        }
        return sb.toString();
    }
}
