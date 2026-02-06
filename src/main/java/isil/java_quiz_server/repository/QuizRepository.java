package isil.java_quiz_server.repository;

import isil.java_quiz_server.modal.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

    List<Quiz> findByUsername(String username);
}
