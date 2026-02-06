package isil.java_quiz_server.repository;

import isil.java_quiz_server.modal.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByUserId(Long userId);

    List<QuizAttempt> findByQuizId(Long quizId);

    List<QuizAttempt> findByUserIdOrderByAttemptedAtDesc(Long userId);

    List<QuizAttempt> findByQuizIdOrderByScoreDesc(Long quizId);
}
