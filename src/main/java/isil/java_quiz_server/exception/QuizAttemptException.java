package isil.java_quiz_server.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a quiz attempt is not allowed.
 * Returns HTTP 400 Bad Request.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class QuizAttemptException extends RuntimeException {

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
}
