package isil.java_quiz_server.repository;

import isil.java_quiz_server.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findByAttemptId(Long attemptId);

    List<Answer> findByQuestionId(Long questionId);

    void deleteByAttemptId(Long attemptId);
}
