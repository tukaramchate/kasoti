package isil.java_quiz_server.service;

import isil.java_quiz_server.dto.*;
import isil.java_quiz_server.exception.BadRequestException;
import isil.java_quiz_server.exception.ForbiddenException;
import isil.java_quiz_server.exception.ResourceNotFoundException;
import isil.java_quiz_server.model.*;
import isil.java_quiz_server.repository.AnswerRepository;
import isil.java_quiz_server.repository.QuizAttemptRepository;
import isil.java_quiz_server.repository.QuizRepository;
import isil.java_quiz_server.repository.UserRepository;
import isil.java_quiz_server.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;

    private static final String SHARE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int SHARE_CODE_LENGTH = 8;
    private final SecureRandom secureRandom = new SecureRandom();

    public QuizService(QuizRepository quizRepository,
            QuizAttemptRepository quizAttemptRepository,
            AnswerRepository answerRepository,
            UserRepository userRepository) {
        this.quizRepository = quizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.answerRepository = answerRepository;
        this.userRepository = userRepository;
    }

    // ========== DTO Conversion Methods ==========

    /**
     * Convert Quiz entity to QuizDTO (hides correct answers).
     */
    private QuizDTO convertToDTO(Quiz quiz) {
        List<QuestionDTO> questionDTOs = quiz.getQuestions().stream()
                .map(q -> new QuestionDTO(q.getId(), q.getText(), q.getOptions()))
                .collect(Collectors.toList());
        return new QuizDTO(quiz.getId(), quiz.getTitle(),
                quiz.getCreatedBy() != null ? quiz.getCreatedBy().getUsername() : null,
                quiz.getCategory(), questionDTOs);
    }

    /**
     * Get quiz by ID as DTO (for students - no correct answers).
     */
    public QuizDTO getQuizByIdDTO(Long id) {
        Quiz quiz = getQuizById(id);
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

    // ========== Pagination Methods ==========

    /**
     * Get paginated quizzes as DTOs.
     */
    public Page<QuizDTO> getQuizzesPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return quizRepository.findAvailableQuizzes(LocalDateTime.now(), pageable).map(this::convertToDTO);
    }

    /**
     * Get paginated quizzes by category as DTOs.
     */
    public Page<QuizDTO> getQuizzesByCategoryPaginated(String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return quizRepository.findByCategory(category, pageable).map(this::convertToDTO);
    }

    /**
     * Search quizzes by title with pagination.
     */
    public Page<QuizDTO> searchQuizzes(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return quizRepository.searchQuizzes(search, pageable).map(this::convertToDTO);
    }

    /**
     * Search quizzes by title and category with pagination.
     */
    public Page<QuizDTO> searchQuizzesByCategory(String search, String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return quizRepository.searchByTitleAndCategory(search, category, pageable).map(this::convertToDTO);
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
        quiz.setStatus(QuizStatus.DRAFT); // New quizzes start as draft
        return quizRepository.save(quiz);
    }

    @Transactional
    public Quiz updateQuiz(Long id, Quiz quizDetails, UserPrincipal principal) {
        Quiz quiz = getQuizById(id);

        // Check ownership (admin can update any)
        if (!principal.isAdmin() && !quiz.getCreatedBy().getId().equals(principal.getId())) {
            throw new ForbiddenException("You can only update your own quizzes");
        }

        quiz.setTitle(quizDetails.getTitle());
        quiz.setDescription(quizDetails.getDescription());
        quiz.setCategory(quizDetails.getCategory());
        quiz.setTimeLimitMinutes(quizDetails.getTimeLimitMinutes());
        quiz.setStartTime(quizDetails.getStartTime());
        quiz.setEndTime(quizDetails.getEndTime());

        if (quizDetails.getQuestions() != null) {
            quiz.getQuestions().clear();
            quiz.getQuestions().addAll(quizDetails.getQuestions());
        }

        return quizRepository.save(quiz);
    }

    @Transactional
    public void deleteQuiz(Long id, UserPrincipal principal) {
        Quiz quiz = getQuizById(id);

        // Check ownership (admin can delete any)
        if (!principal.isAdmin() && !quiz.getCreatedBy().getId().equals(principal.getId())) {
            throw new ForbiddenException("You can only delete your own quizzes");
        }

        quizRepository.delete(quiz);
    }

    // ========== Publish & Share ==========

    @Transactional
    public PublishQuizResponse publishQuiz(Long quizId, UserPrincipal principal) {
        Quiz quiz = getQuizById(quizId);

        // Check ownership
        if (!principal.isAdmin() && !quiz.getCreatedBy().getId().equals(principal.getId())) {
            throw new ForbiddenException("You can only publish your own quizzes");
        }

        // Validate quiz has questions
        if (quiz.getQuestions() == null || quiz.getQuestions().isEmpty()) {
            throw new BadRequestException("Cannot publish a quiz without questions");
        }

        // Generate share code if not already published
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

        // Check ownership
        if (!principal.isAdmin() && !quiz.getCreatedBy().getId().equals(principal.getId())) {
            throw new ForbiddenException("You can only close your own quizzes");
        }

        quiz.setStatus(QuizStatus.CLOSED);
        return quizRepository.save(quiz);
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

    // ========== Quiz Submission ==========

    @Transactional
    public QuizResultResponse submitQuiz(Long quizId, SubmitQuizRequest request, UserPrincipal principal) {
        Quiz quiz = getQuizById(quizId);
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        // Check if quiz is available
        if (!quiz.isAvailable()) {
            throw new BadRequestException("This quiz is not available for submission");
        }

        // Check if user has already attempted this quiz
        if (quizAttemptRepository.existsByUserIdAndQuizId(principal.getId(), quizId)) {
            throw new BadRequestException("You have already attempted this quiz. Only one attempt is allowed.");
        }

        // Calculate score and track answers
        Map<Long, String> submittedAnswers = request.getAnswers();
        List<Answer> answers = new ArrayList<>();
        int correctCount = 0;
        int marksObtained = 0;
        int totalQuestions = quiz.getQuestions().size();
        int totalMarks = quiz.getTotalMarks();

        // Create attempt first
        QuizAttempt attempt = new QuizAttempt();
        attempt.setUser(user);
        attempt.setQuiz(quiz);
        attempt.setTotalQuestions(totalQuestions);
        attempt.setTotalMarks(totalMarks);
        attempt.setTimeTakenSeconds(request.getTimeTakenSeconds());

        for (Question question : quiz.getQuestions()) {
            String submittedAnswer = submittedAnswers.get(question.getId());
            boolean isCorrect = submittedAnswer != null && submittedAnswer.equals(question.getCorrectOption());

            Answer answer = new Answer();
            answer.setAttempt(attempt);
            answer.setQuestion(question);
            answer.setSelectedOption(submittedAnswer);
            answer.setIsCorrect(isCorrect);

            if (isCorrect) {
                correctCount++;
                int marks = question.getMarks() != null ? question.getMarks() : 1;
                marksObtained += marks;
                answer.setMarksObtained(marks);
            } else {
                answer.setMarksObtained(0);
            }

            answers.add(answer);
        }

        // Calculate percentage score
        int score = totalMarks > 0 ? (int) ((marksObtained * 100.0) / totalMarks) : 0;

        attempt.setScore(score);
        attempt.setCorrectAnswers(correctCount);
        attempt.setMarksObtained(marksObtained);
        attempt.setAnswers(answers);

        quizAttemptRepository.save(attempt);

        // Return result (no correct answers shown)
        return new QuizResultResponse(
                quiz.getId(),
                quiz.getTitle(),
                correctCount,
                totalQuestions,
                request.getTimeTakenSeconds());
    }

    // ========== Quiz Attempt Queries ==========

    public boolean hasUserAttempted(Long userId, Long quizId) {
        return quizAttemptRepository.existsByUserIdAndQuizId(userId, quizId);
    }

    public List<QuizAttempt> getUserAttempts(Long userId) {
        return quizAttemptRepository.findByUserIdOrderByAttemptedAtDesc(userId);
    }

    public Page<QuizAttempt> getUserAttemptsPaginated(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return quizAttemptRepository.findByUserIdOrderByAttemptedAtDesc(userId, pageable);
    }

    public List<QuizAttempt> getQuizLeaderboard(Long quizId) {
        return quizAttemptRepository.findByQuizIdOrderByScoreDescTimeTakenSecondsAsc(quizId);
    }

    public List<QuizAttempt> getQuizStudents(Long quizId, UserPrincipal principal) {
        Quiz quiz = getQuizById(quizId);

        // Only quiz owner or admin can see students
        if (!principal.isAdmin() && !quiz.getCreatedBy().getId().equals(principal.getId())) {
            throw new ForbiddenException("You can only view students for your own quizzes");
        }

        return quizAttemptRepository.findByQuizIdOrderByScoreAsc(quizId);
    }
}
