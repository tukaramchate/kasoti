package isil.java_quiz_server.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a quiz attempt is not allowed.
 */
public class QuizAttemptException extends BaseAppException {

    public QuizAttemptException(String message) {
        super(message);
    }

    public QuizAttemptException(String message, Throwable cause) {
        super(message, cause);
    }

    public static QuizAttemptException alreadyAttempted(Long quizId) {
        return new QuizAttemptException(
                String.format("You have already attempted quiz with ID: %d", quizId));
    }

    public static QuizAttemptException quizNotAvailable(Long quizId) {
        return new QuizAttemptException(
                String.format("Quiz with ID: %d is not available for attempt", quizId));
    }

    public static QuizAttemptException timeExpired(Long quizId) {
        return new QuizAttemptException(
                String.format("Time has expired for quiz with ID: %d", quizId));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.BAD_REQUEST;
    }

    @Override
    public String getErrorCode() {
        return "QUIZ_ATTEMPT_ERROR";
    }
}
