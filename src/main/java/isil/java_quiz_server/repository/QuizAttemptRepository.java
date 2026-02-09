package isil.java_quiz_server.repository;

import isil.java_quiz_server.model.QuizAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByUserId(Long userId);

    List<QuizAttempt> findByQuizId(Long quizId);

    List<QuizAttempt> findByUserIdOrderByAttemptedAtDesc(Long userId);

    Page<QuizAttempt> findByUserIdOrderByAttemptedAtDesc(Long userId, Pageable pageable);

    // Leaderboard queries - sorted by score descending, then time ascending
    List<QuizAttempt> findByQuizIdOrderByScoreDescTimeTakenSecondsAsc(Long quizId);

    // For teacher dashboard - sorted by score ascending
    List<QuizAttempt> findByQuizIdOrderByScoreAsc(Long quizId);

    // Check if user has already attempted
    boolean existsByUserIdAndQuizId(Long userId, Long quizId);

    // Count queries for dashboard
    long countByQuizId(Long quizId);

    long countByUserId(Long userId);

    // Find attempts for quizzes created by a specific teacher
    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.quiz.createdBy.id = :teacherId ORDER BY qa.attemptedAt DESC")
    List<QuizAttempt> findByQuizCreatedById(@Param("teacherId") Long teacherId);

    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.quiz.createdBy.id = :teacherId ORDER BY qa.attemptedAt DESC")
    Page<QuizAttempt> findByQuizCreatedById(@Param("teacherId") Long teacherId, Pageable pageable);

    // Count total attempts on teacher's quizzes
    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.quiz.createdBy.id = :teacherId")
    long countByQuizCreatedById(@Param("teacherId") Long teacherId);

    // Average score for a quiz
    @Query("SELECT AVG(qa.score) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId")
    Double findAverageScoreByQuizId(@Param("quizId") Long quizId);

    // Average score across all of teacher's quizzes
    @Query("SELECT AVG(qa.score) FROM QuizAttempt qa WHERE qa.quiz.createdBy.id = :teacherId")
    Double findAverageScoreByTeacherId(@Param("teacherId") Long teacherId);

    // ========== Optimized Fetch Join Queries (N+1 prevention) ==========

    // Fetch attempt with user and quiz eagerly to prevent N+1
    @Query("SELECT qa FROM QuizAttempt qa " +
            "JOIN FETCH qa.user " +
            "JOIN FETCH qa.quiz " +
            "WHERE qa.id = :id")
    java.util.Optional<QuizAttempt> findByIdWithUserAndQuiz(@Param("id") Long id);

    // Fetch attempts with answers for detailed view
    @Query("SELECT DISTINCT qa FROM QuizAttempt qa " +
            "LEFT JOIN FETCH qa.answers a " +
            "LEFT JOIN FETCH a.question " +
            "JOIN FETCH qa.user " +
            "JOIN FETCH qa.quiz " +
            "WHERE qa.id = :id")
    java.util.Optional<QuizAttempt> findByIdWithDetails(@Param("id") Long id);

    // Leaderboard with user info (prevents N+1 when displaying usernames)
    @Query("SELECT qa FROM QuizAttempt qa " +
            "JOIN FETCH qa.user " +
            "WHERE qa.quiz.id = :quizId " +
            "ORDER BY qa.score DESC, qa.timeTakenSeconds ASC")
    List<QuizAttempt> findLeaderboardByQuizId(@Param("quizId") Long quizId);

    // Average time for a quiz
    @Query("SELECT AVG(qa.timeTakenSeconds) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId")
    Double findAverageTimeByQuizId(@Param("quizId") Long quizId);
}
