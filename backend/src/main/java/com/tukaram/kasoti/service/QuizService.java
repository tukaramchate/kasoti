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
    private final QuestionValidator questionValidator;

    private static final String SHARE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int SHARE_CODE_LENGTH = 8;
    private static final int MAX_QUESTIONS_PER_QUIZ = 500;
    private static final int MAX_OPTIONS_PER_QUESTION = 10;
    private static final int TIME_LIMIT_GRACE_SECONDS = 30; // Grace period for network latency
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
     * Handles all question types — DESCRIPTIVE questions have no options.
     */
    private QuizDTO convertToDTO(Quiz quiz) {
        List<Question> questionList = new ArrayList<>(quiz.getQuestions());

        // Shuffle questions if enabled
        if (Boolean.TRUE.equals(quiz.getShuffleQuestions())) {
            Collections.shuffle(questionList);
        }

        List<QuestionDTO> questionDTOs = questionList.stream()
                .map(q -> {
                    QuestionType type = q.getQuestionType() != null ? q.getQuestionType() : QuestionType.MCQ;

                    // DESCRIPTIVE questions have no options
                    List<String> options = null;
                    if (type != QuestionType.DESCRIPTIVE && q.getOptions() != null) {
                        options = new ArrayList<>(q.getOptions());
                        // Shuffle options if enabled (not for TRUE_FALSE — order matters)
                        if (type != QuestionType.TRUE_FALSE && Boolean.TRUE.equals(quiz.getShuffleOptions())) {
                            Collections.shuffle(options);
                        }
                    }

                    return QuestionDTO.builder()
                            .id(q.getId())
                            .text(q.getText())
                            .options(options)
                            .questionType(type)
                            .marks(q.getMarks())
                            .build();
                })
                .toList();

        return QuizDTO.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .username(quiz.getCreatedBy() != null ? quiz.getCreatedBy().getUsername() : null)
                .category(quiz.getCategory())
                .difficulty(quiz.getDifficulty())
                .tags(quiz.getTags())
                .shareCode(quiz.getShareCode())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .passPercentage(quiz.getPassPercentage())
                .negativeMarking(quiz.getNegativeMarking())
                .shuffleQuestions(quiz.getShuffleQuestions())
                .shuffleOptions(quiz.getShuffleOptions())
                .startTime(quiz.getStartTime())
                .endTime(quiz.getEndTime())
                .totalMarks(quiz.getTotalMarks())
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
                .difficulty(quiz.getDifficulty())
                .tags(quiz.getTags())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .build();
    }

    /**
     * Get quiz by ID as DTO (for students - no correct answers).
     * Checks availability — students cannot view unpublished or expired quizzes.
     */
    public QuizDTO getQuizByIdDTO(Long id) {
        Quiz quiz = getQuizById(id);
        if (!quiz.isAvailable()) {
            throw new BadRequestException("This quiz is not currently available");
        }
        return convertToDTO(quiz);
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
        size = capPageSize(size);
        return quizRepository.findAvailableWithFilters(
                        blankToEmpty(search), blankToEmpty(category),
                        blankToEmpty(difficulty), blankToEmpty(tags),
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
    public Quiz createQuiz(CreateQuizRequest request, UserPrincipal principal) {
        if (!principal.isTeacherOrAdmin()) {
            throw new ForbiddenException("Only teachers and admins can create quizzes");
        }

        Quiz quiz = convertFromRequest(request);
        validateQuizLimits(quiz);
        validateQuestions(quiz);

        User creator = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        quiz.setCreatedBy(creator);
        quiz.setStatus(QuizStatus.DRAFT);
        quiz.setShareCode(null); // Share code generated on publish
        return quizRepository.save(quiz);
    }

    @Transactional
    public Quiz updateQuiz(Long id, CreateQuizRequest request, UserPrincipal principal) {
        Quiz quiz = getQuizById(id);
        validateOwnership(quiz, principal, "update");

        // Block updates to published/closed quizzes to protect data integrity
        if (quiz.getStatus() != QuizStatus.DRAFT) {
            throw new BadRequestException(
                    "Cannot update a " + quiz.getStatus().name().toLowerCase()
                            + " quiz. Only DRAFT quizzes can be edited.");
        }

        Quiz quizDetails = convertFromRequest(request);
        validateQuizLimits(quizDetails);
        validateQuestions(quizDetails);

        quiz.setTitle(quizDetails.getTitle());
        quiz.setDescription(quizDetails.getDescription());
        quiz.setCategory(quizDetails.getCategory());
        quiz.setTimeLimitMinutes(quizDetails.getTimeLimitMinutes());
        quiz.setStartTime(quizDetails.getStartTime());
        quiz.setEndTime(quizDetails.getEndTime());
        quiz.setNegativeMarking(quizDetails.getNegativeMarking());
        quiz.setShuffleQuestions(quizDetails.getShuffleQuestions());
        quiz.setShuffleOptions(quizDetails.getShuffleOptions());
        quiz.setPassPercentage(quizDetails.getPassPercentage());
        quiz.setDifficulty(quizDetails.getDifficulty());
        quiz.setTags(quizDetails.getTags());

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

        // Delete ElementCollection rows first, then answers, then attempts, then quiz
        answerRepository.deleteSelectedOptionsByQuizId(id);
        answerRepository.deleteAllByQuizId(id);
        quizAttemptRepository.deleteAllByQuizId(id);
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

        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            throw new BadRequestException("Only published quizzes can be closed");
        }

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

        // Server-side time limit enforcement
        if (quiz.getTimeLimitMinutes() != null && request.getTimeTakenSeconds() != null) {
            int limitSeconds = quiz.getTimeLimitMinutes() * 60 + TIME_LIMIT_GRACE_SECONDS;
            if (request.getTimeTakenSeconds() > limitSeconds) {
                throw new ForbiddenException(
                        "Time limit exceeded. Allowed: " + quiz.getTimeLimitMinutes()
                                + " minutes, taken: " + (request.getTimeTakenSeconds() / 60) + " minutes");
            }
        }

        // Build lookup maps for submitted answers (backward compatible)
        Map<Long, String> singleAnswers = request.getAnswers() != null ? request.getAnswers() : Map.of();
        Map<Long, List<String>> multiAnswers = request.getMultiAnswers() != null ? request.getMultiAnswers()
                : Map.of();
        Map<Long, String> textAnswers = request.getTextAnswers() != null ? request.getTextAnswers() : Map.of();

        List<Answer> answers = new ArrayList<>();
        int correctCount = 0;
        int marksObtained = 0;
        int descriptivePending = 0;
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
            QuestionType type = question.getQuestionType() != null ? question.getQuestionType() : QuestionType.MCQ;
            int qMarks = question.getMarks() != null ? question.getMarks() : 1;

            Answer answer;
            switch (type) {
                case MCQ, TRUE_FALSE -> {
                    answer = scoreSingleOption(attempt, question, singleAnswers.get(question.getId()),
                            qMarks, quiz.getNegativeMarking());
                    if (Boolean.TRUE.equals(answer.getIsCorrect()))
                        correctCount++;
                    marksObtained += answer.getMarksObtained();
                }
                case MSQ -> {
                    answer = scoreMultiOption(attempt, question, multiAnswers.get(question.getId()),
                            qMarks, quiz.getNegativeMarking());
                    if (Boolean.TRUE.equals(answer.getIsCorrect()))
                        correctCount++;
                    marksObtained += answer.getMarksObtained();
                }
                case DESCRIPTIVE -> {
                    answer = recordDescriptiveAnswer(attempt, question, textAnswers.get(question.getId()));
                    descriptivePending++;
                }
                default -> throw new BadRequestException("Unsupported question type: " + type);
            }
            answers.add(answer);
        }

        // Ensure marks don't go below 0
        marksObtained = Math.max(0, marksObtained);

        int score = totalMarks > 0 ? (int) Math.round((marksObtained * 100.0) / totalMarks) : 0;

        attempt.setScore(score);
        attempt.setCorrectAnswers(correctCount);
        attempt.setMarksObtained(marksObtained);
        attempt.setAnswers(answers);

        quizAttemptRepository.save(attempt);

        // Build per-question review data
        List<AnswerDTO> answerDTOs = answers.stream().map(this::convertToAnswerDTO).toList();

        // When descriptive answers are pending, pass/fail is indeterminate
        Boolean passed;
        if (descriptivePending > 0) {
            passed = null; // provisional — will be determined after manual evaluation
        } else if (quiz.getPassPercentage() != null && quiz.getPassPercentage() > 0) {
            passed = score >= quiz.getPassPercentage();
        } else {
            passed = true; // no pass threshold set, all auto-graded
        }

        return new QuizResultResponse(
                quiz.getId(), quiz.getTitle(), correctCount,
                totalQuestions, request.getTimeTakenSeconds(),
                marksObtained, totalMarks, passed, answerDTOs, descriptivePending);
    }

    // ========== Per-Type Scoring Methods ==========

    /**
     * Score a single-option answer (MCQ or TRUE_FALSE).
     * Backward compatible — uses the same correctOption field.
     */
    private Answer scoreSingleOption(QuizAttempt attempt, Question question,
            String selectedOption, int qMarks, Boolean negativeMarking) {
        boolean isCorrect = selectedOption != null && selectedOption.equals(question.getCorrectOption());
        int questionMarks;

        if (isCorrect) {
            questionMarks = qMarks;
        } else if (Boolean.TRUE.equals(negativeMarking) && selectedOption != null) {
            questionMarks = -(int) Math.ceil(qMarks * 0.25);
        } else {
            questionMarks = 0;
        }

        return Answer.builder()
                .attempt(attempt)
                .question(question)
                .selectedOption(selectedOption)
                .isCorrect(isCorrect)
                .marksObtained(questionMarks)
                .evaluationStatus(EvaluationStatus.AUTO_GRADED)
                .build();
    }

    /**
     * Score a multi-option answer (MSQ).
     * Partial marking: marks = (correctSelected / totalCorrect) * qMarks,
     * minus deduction for each wrong selection.
     * Full marks only if all correct options selected and no wrong ones.
     */
    private Answer scoreMultiOption(QuizAttempt attempt, Question question,
            List<String> selectedOptions, int qMarks, Boolean negativeMarking) {
        List<String> correctOptions = question.getCorrectOptions();
        if (correctOptions == null || correctOptions.isEmpty()) {
            // Fallback for legacy data: treat as MCQ
            String single = selectedOptions != null && !selectedOptions.isEmpty() ? selectedOptions.get(0) : null;
            return scoreSingleOption(attempt, question, single, qMarks, negativeMarking);
        }

        Set<String> correctSet = new HashSet<>(correctOptions);
        Set<String> selectedSet = selectedOptions != null ? new HashSet<>(selectedOptions) : Set.of();

        int totalCorrect = correctSet.size();
        int correctSelected = 0;
        int wrongSelected = 0;

        for (String sel : selectedSet) {
            if (correctSet.contains(sel)) {
                correctSelected++;
            } else {
                wrongSelected++;
            }
        }

        boolean isFullyCorrect = correctSelected == totalCorrect && wrongSelected == 0;
        int questionMarks;

        if (selectedSet.isEmpty()) {
            questionMarks = 0; // unanswered
        } else if (isFullyCorrect) {
            questionMarks = qMarks; // perfect answer
        } else if (wrongSelected > 0 && Boolean.TRUE.equals(negativeMarking)) {
            // Deduct for wrong selections
            questionMarks = (int) Math.round((correctSelected * 1.0 / totalCorrect) * qMarks)
                    - (int) Math.ceil(wrongSelected * qMarks * 0.25 / totalCorrect);
            questionMarks = Math.max(0, questionMarks); // MSQ partial never goes negative
        } else {
            // Partial marking: proportional to correct selections
            questionMarks = (int) Math.round((correctSelected * 1.0 / totalCorrect) * qMarks);
        }

        return Answer.builder()
                .attempt(attempt)
                .question(question)
                .selectedOptions(selectedOptions)
                .isCorrect(isFullyCorrect)
                .marksObtained(questionMarks)
                .evaluationStatus(EvaluationStatus.AUTO_GRADED)
                .build();
    }

    /**
     * Record a descriptive answer — not auto-graded.
     * Marks remain 0 and status PENDING until a teacher evaluates.
     */
    private Answer recordDescriptiveAnswer(QuizAttempt attempt, Question question, String textAnswer) {
        return Answer.builder()
                .attempt(attempt)
                .question(question)
                .textAnswer(textAnswer)
                .isCorrect(null) // unknown until evaluated
                .marksObtained(0)
                .evaluationStatus(EvaluationStatus.PENDING)
                .build();
    }

    /**
     * Convert an Answer entity to AnswerDTO (safe for review).
     */
    private AnswerDTO convertToAnswerDTO(Answer a) {
        Question q = a.getQuestion();
        QuestionType type = q.getQuestionType() != null ? q.getQuestionType() : QuestionType.MCQ;

        return AnswerDTO.builder()
                .id(a.getId())
                .questionId(q.getId())
                .questionText(q.getText())
                .questionType(type)
                .selectedOption(a.getSelectedOption())
                .correctOption(q.getCorrectOption())
                .selectedOptions(a.getSelectedOptions())
                .correctOptions(q.getCorrectOptions())
                .textAnswer(a.getTextAnswer())
                .modelAnswer(q.getModelAnswer())
                .isCorrect(a.getIsCorrect())
                .marksObtained(a.getMarksObtained())
                .maxMarks(q.getMarks() != null ? q.getMarks() : 1)
                .evaluationStatus(a.getEvaluationStatus())
                .evaluationComment(a.getEvaluationComment())
                .build();
    }

    // ========== Quiz Attempt Queries ==========

    public boolean hasUserAttempted(Long userId, Long quizId) {
        return quizAttemptRepository.existsByUserIdAndQuizId(userId, quizId);
    }

    public List<AttemptSummaryDTO> getUserAttempts(Long userId) {
        return quizAttemptRepository.findByUserIdOrderByAttemptedAtDesc(userId).stream()
                .map(this::convertToAttemptSummary)
                .toList();
    }

    public Page<AttemptSummaryDTO> getUserAttemptsPaginated(Long userId, int page, int size) {
        size = capPageSize(size);
        return quizAttemptRepository.findByUserIdOrderByAttemptedAtDesc(userId, PageRequest.of(page, size))
                .map(this::convertToAttemptSummary);
    }

    public List<LeaderboardEntryDTO> getQuizLeaderboard(Long quizId) {
        return quizAttemptRepository.findLeaderboardByQuizId(quizId).stream()
                .map(this::convertToLeaderboardEntry)
                .toList();
    }

    public List<LeaderboardEntryDTO> getQuizStudents(Long quizId, UserPrincipal principal, String sort) {
        Quiz quiz = getQuizById(quizId);
        validateOwnership(quiz, principal, "view students for");

        List<QuizAttempt> attempts = quizAttemptRepository.findByQuizId(quizId);
        attempts.sort(sort != null ? SORT_STRATEGIES.getOrDefault(sort, DEFAULT_SORT) : DEFAULT_SORT);
        return attempts.stream().map(this::convertToLeaderboardEntry).toList();
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
     * Convert QuizAttempt to a safe LeaderboardEntryDTO (no PII leak).
     */
    private LeaderboardEntryDTO convertToLeaderboardEntry(QuizAttempt attempt) {
        return LeaderboardEntryDTO.builder()
                .attemptId(attempt.getId())
                .username(attempt.getUser().getUsername())
                .score(attempt.getScore())
                .marksObtained(attempt.getMarksObtained())
                .totalMarks(attempt.getTotalMarks())
                .correctAnswers(attempt.getCorrectAnswers())
                .totalQuestions(attempt.getTotalQuestions())
                .timeTakenSeconds(attempt.getTimeTakenSeconds())
                .attemptedAt(attempt.getAttemptedAt())
                .build();
    }

    /**
     * Convert QuizAttempt to a safe AttemptSummaryDTO for student history.
     */
    private AttemptSummaryDTO convertToAttemptSummary(QuizAttempt attempt) {
        return AttemptSummaryDTO.builder()
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
                .build();
    }

    /**
     * Creates a standard descending pageable sorted by ID.
     */
    private Pageable pageableDesc(int page, int size) {
        return PageRequest.of(Math.max(0, page), capPageSize(size), Sort.by("id").descending());
    }

    /**
     * Cap pagination size to prevent OOM from excessive page sizes.
     */
    private int capPageSize(int size) {
        return Math.max(1, Math.min(size, 100));
    }

    /**
     * Converts null/blank strings to empty string for JPQL parameters.
     * Avoids PostgreSQL bytea type inference issues with null parameter binding.
     */
    private String blankToEmpty(String value) {
        return (value != null && !value.isBlank()) ? value : "";
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

    /**
     * Validate quiz size limits to prevent abuse.
     */
    private void validateQuizLimits(Quiz quiz) {
        if (quiz.getQuestions() != null) {
            if (quiz.getQuestions().size() > MAX_QUESTIONS_PER_QUIZ) {
                throw new BadRequestException(
                        "Quiz cannot have more than " + MAX_QUESTIONS_PER_QUIZ + " questions");
            }
            for (Question question : quiz.getQuestions()) {
                if (question.getOptions() != null && question.getOptions().size() > MAX_OPTIONS_PER_QUESTION) {
                    throw new BadRequestException(
                            "Each question cannot have more than " + MAX_OPTIONS_PER_QUESTION + " options");
                }
            }
        }
    }

    /**
     * Validate every question's structure according to its QuestionType.
     * Delegates to the injected QuestionValidator component.
     */
    private void validateQuestions(Quiz quiz) {
        if (quiz.getQuestions() == null || quiz.getQuestions().isEmpty()) {
            return; // empty quiz is allowed in DRAFT
        }
        for (int i = 0; i < quiz.getQuestions().size(); i++) {
            questionValidator.validate(quiz.getQuestions().get(i), i);
        }
    }

    /**
     * Convert CreateQuizRequest DTO to Quiz entity.
     * Prevents mass assignment — client cannot set id, createdBy, status, shareCode.
     */
    private Quiz convertFromRequest(CreateQuizRequest request) {
        List<Question> questions = null;
        if (request.getQuestions() != null) {
            questions = request.getQuestions().stream()
                    .map(qr -> Question.builder()
                            .text(qr.getText())
                            .questionType(qr.getQuestionType() != null
                                    ? QuestionType.valueOf(qr.getQuestionType())
                                    : QuestionType.MCQ)
                            .options(qr.getOptions())
                            .correctOption(qr.getCorrectOption())
                            .correctOptions(qr.getCorrectOptions())
                            .modelAnswer(qr.getModelAnswer())
                            .keywords(qr.getKeywords())
                            .marks(qr.getMarks() != null ? qr.getMarks() : 1)
                            .build())
                    .collect(Collectors.toList());
        }

        return Quiz.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory() != null ? request.getCategory() : "General")
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .negativeMarking(request.getNegativeMarking() != null ? request.getNegativeMarking() : false)
                .shuffleQuestions(request.getShuffleQuestions() != null ? request.getShuffleQuestions() : false)
                .shuffleOptions(request.getShuffleOptions() != null ? request.getShuffleOptions() : false)
                .passPercentage(request.getPassPercentage())
                .difficulty(request.getDifficulty())
                .tags(request.getTags())
                .questions(questions)
                .build();
    }
}
