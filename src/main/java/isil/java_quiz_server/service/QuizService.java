package isil.java_quiz_server.service;

import isil.java_quiz_server.dto.QuizResultResponse;
import isil.java_quiz_server.dto.SubmitQuizRequest;
import isil.java_quiz_server.exception.ResourceNotFoundException;
import isil.java_quiz_server.exception.UnauthorizedException;
import isil.java_quiz_server.model.Question;
import isil.java_quiz_server.model.Quiz;
import isil.java_quiz_server.model.QuizAttempt;
import isil.java_quiz_server.model.User;
import isil.java_quiz_server.repository.QuizAttemptRepository;
import isil.java_quiz_server.repository.QuizRepository;
import isil.java_quiz_server.repository.UserRepository;
import isil.java_quiz_server.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final UserRepository userRepository;

    public QuizService(QuizRepository quizRepository,
            QuizAttemptRepository quizAttemptRepository,
            UserRepository userRepository) {
        this.quizRepository = quizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.userRepository = userRepository;
    }

    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    public Quiz getQuizById(Long id) {
        return quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", id));
    }

    public List<Quiz> getQuizzesByUsername(String username) {
        return quizRepository.findByUsername(username);
    }

    public List<Quiz> getQuizzesByCategory(String category) {
        return quizRepository.findByCategory(category);
    }

    @Transactional
    public Quiz createQuiz(Quiz quiz, UserPrincipal principal) {
        if (!Boolean.TRUE.equals(principal.getIsTeacher())) {
            throw new UnauthorizedException("Only teachers can create quizzes");
        }
        quiz.setUsername(principal.getUsername());
        return quizRepository.save(quiz);
    }

    @Transactional
    public Quiz updateQuiz(Long id, Quiz quizDetails, UserPrincipal principal) {
        Quiz quiz = getQuizById(id);

        // Only the owner can update
        if (!quiz.getUsername().equals(principal.getUsername())) {
            throw new UnauthorizedException("You can only update your own quizzes");
        }

        quiz.setTitle(quizDetails.getTitle());
        if (quizDetails.getQuestions() != null) {
            quiz.getQuestions().clear();
            quiz.getQuestions().addAll(quizDetails.getQuestions());
        }

        return quizRepository.save(quiz);
    }

    @Transactional
    public void deleteQuiz(Long id, UserPrincipal principal) {
        Quiz quiz = getQuizById(id);

        // Only the owner can delete
        if (!quiz.getUsername().equals(principal.getUsername())) {
            throw new UnauthorizedException("You can only delete your own quizzes");
        }

        quizRepository.delete(quiz);
    }

    @Transactional
    public QuizResultResponse submitQuiz(Long quizId, SubmitQuizRequest request, UserPrincipal principal) {
        Quiz quiz = getQuizById(quizId);
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        // Check if user has already attempted this quiz
        if (quizAttemptRepository.existsByUserIdAndQuizId(principal.getId(), quizId)) {
            throw new IllegalStateException("You have already attempted this quiz. Only one attempt is allowed.");
        }

        // Calculate score
        Map<Long, String> answers = request.getAnswers();
        int correctCount = 0;
        int totalQuestions = quiz.getQuestions().size();

        for (Question question : quiz.getQuestions()) {
            String submittedAnswer = answers.get(question.getId());
            if (submittedAnswer != null && submittedAnswer.equals(question.getCorrectOption())) {
                correctCount++;
            }
        }

        int score = totalQuestions > 0 ? (int) ((correctCount * 100.0) / totalQuestions) : 0;

        // Save attempt
        QuizAttempt attempt = new QuizAttempt();
        attempt.setUser(user);
        attempt.setQuiz(quiz);
        attempt.setScore(score);
        attempt.setTotalQuestions(totalQuestions);
        attempt.setCorrectAnswers(correctCount);
        attempt.setTimeTakenSeconds(request.getTimeTakenSeconds());
        quizAttemptRepository.save(attempt);

        // Return result (no correct answers shown)
        return new QuizResultResponse(
                quiz.getId(),
                quiz.getTitle(),
                correctCount,
                totalQuestions,
                request.getTimeTakenSeconds());
    }

    public boolean hasUserAttempted(Long userId, Long quizId) {
        return quizAttemptRepository.existsByUserIdAndQuizId(userId, quizId);
    }

    public List<QuizAttempt> getUserAttempts(Long userId) {
        return quizAttemptRepository.findByUserIdOrderByAttemptedAtDesc(userId);
    }

    public List<QuizAttempt> getQuizLeaderboard(Long quizId) {
        return quizAttemptRepository.findByQuizIdOrderByScoreDescTimeTakenSecondsAsc(quizId);
    }

    public List<QuizAttempt> getQuizStudents(Long quizId, String username) {
        Quiz quiz = getQuizById(quizId);
        // Only quiz owner can see students
        if (!quiz.getUsername().equals(username)) {
            throw new UnauthorizedException("You can only view students for your own quizzes");
        }
        return quizAttemptRepository.findByQuizIdOrderByScoreAsc(quizId);
    }
}
