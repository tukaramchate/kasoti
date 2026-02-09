package isil.java_quiz_server.repository;

import isil.java_quiz_server.model.Quiz;
import isil.java_quiz_server.model.QuizStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

        @EntityGraph(attributePaths = { "questions" })
        List<Quiz> findAll();

        @EntityGraph(attributePaths = { "questions" })
        Optional<Quiz> findById(Long id);

        // Find by share code for public access
        @EntityGraph(attributePaths = { "questions" })
        Optional<Quiz> findByShareCode(String shareCode);

        // Find quizzes by creator
        @EntityGraph(attributePaths = { "questions" })
        List<Quiz> findByCreatedById(Long userId);

        @EntityGraph(attributePaths = { "questions" })
        Page<Quiz> findByCreatedById(Long userId, Pageable pageable);

        // Find by category
        @EntityGraph(attributePaths = { "questions" })
        List<Quiz> findByCategory(String category);

        // Find by status
        @EntityGraph(attributePaths = { "questions" })
        List<Quiz> findByStatus(QuizStatus status);

        @EntityGraph(attributePaths = { "questions" })
        Page<Quiz> findByStatus(QuizStatus status, Pageable pageable);

        // Find by status and creator
        @EntityGraph(attributePaths = { "questions" })
        Page<Quiz> findByStatusAndCreatedById(QuizStatus status, Long userId, Pageable pageable);

        // ========== Pagination Methods ==========

        @EntityGraph(attributePaths = { "questions" })
        Page<Quiz> findAll(Pageable pageable);

        @EntityGraph(attributePaths = { "questions" })
        Page<Quiz> findByCategory(String category, Pageable pageable);

        // ========== Search Methods ==========

        @EntityGraph(attributePaths = { "questions" })
        @Query("SELECT q FROM Quiz q WHERE LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%'))")
        Page<Quiz> searchByTitle(@Param("search") String search, Pageable pageable);

        @EntityGraph(attributePaths = { "questions" })
        @Query("SELECT q FROM Quiz q WHERE LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%')) AND q.category = :category")
        Page<Quiz> searchByTitleAndCategory(@Param("search") String search, @Param("category") String category,
                        Pageable pageable);

        @EntityGraph(attributePaths = { "questions" })
        @Query("SELECT q FROM Quiz q WHERE LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(q.category) LIKE LOWER(CONCAT('%', :search, '%'))")
        Page<Quiz> searchQuizzes(@Param("search") String search, Pageable pageable);

        // ========== Available Quizzes for Students ==========

        @EntityGraph(attributePaths = { "questions" })
        @Query("SELECT q FROM Quiz q WHERE q.status = 'PUBLISHED' AND " +
                        "(q.startTime IS NULL OR q.startTime <= :now) AND " +
                        "(q.endTime IS NULL OR q.endTime >= :now)")
        List<Quiz> findAvailableQuizzes(@Param("now") LocalDateTime now);

        @EntityGraph(attributePaths = { "questions" })
        @Query("SELECT q FROM Quiz q WHERE q.status = 'PUBLISHED' AND " +
                        "(q.startTime IS NULL OR q.startTime <= :now) AND " +
                        "(q.endTime IS NULL OR q.endTime >= :now)")
        Page<Quiz> findAvailableQuizzes(@Param("now") LocalDateTime now, Pageable pageable);

        // ========== Count queries for dashboard ==========

        long countByCreatedById(Long userId);

        long countByCreatedByIdAndStatus(Long userId, QuizStatus status);

        long countByStatus(QuizStatus status);
}
