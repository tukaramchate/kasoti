package isil.java_quiz_server.repository;

import isil.java_quiz_server.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

    List<Quiz> findByUsername(String username);

    List<Quiz> findByCategory(String category);
}
