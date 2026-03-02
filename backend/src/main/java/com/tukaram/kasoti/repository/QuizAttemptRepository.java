package com.tukaram.kasoti.repository;

import com.tukaram.kasoti.model.QuizAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByUserId(Long userId);

    List<QuizAttempt> findByQuizId(Long quizId);

    // Delete all attempts for a quiz (native SQL to avoid Hibernate cascade issues)
    @Modifying
    @Query(value = "DELETE FROM quiz_attempt WHERE quiz_id = :quizId", nativeQuery = true)
    void deleteAllByQuizId(@Param("quizId") Long quizId);

    // Delete all attempts by a user (native SQL to avoid Hibernate cascade issues)
    @Modifying
    @Query(value = "DELETE FROM quiz_attempt WHERE user_id = :userId", nativeQuery = true)
    void deleteAllByUserId(@Param("userId") Long userId);

    List<QuizAttempt> findByUserIdOrderByAttemptedAtDesc(Long userId);

    Page<QuizAttempt> findByUserIdOrderByAttemptedAtDesc(Long userId, Pageable pageable);

    // Leaderboard queries - sorted by score descending, then time ascending
    List<QuizAttempt> findByQuizIdOrderByScoreDescTimeTakenSecondsAsc(Long quizId);

    // For export: with user/quiz eagerly loaded (prevents N+1)
    @Query("SELECT qa FROM QuizAttempt qa " +
            "JOIN FETCH qa.user " +
            "JOIN FETCH qa.quiz q " +
            "LEFT JOIN FETCH q.questions " +
            "WHERE qa.quiz.id = :quizId " +
            "ORDER BY qa.score DESC, qa.timeTakenSeconds ASC")
    List<QuizAttempt> findByQuizIdWithUserForExport(@Param("quizId") Long quizId);

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

    // ========== Batch Aggregation (prevents N+1 in Dashboard) ==========

    /**
     * Get attempt count and average score per quiz for a list of quiz IDs in one query.
     * Returns Object[] with [quizId, count, avgScore].
     */
    @Query("SELECT qa.quiz.id, COUNT(qa), AVG(qa.score) FROM QuizAttempt qa " +
            "WHERE qa.quiz.id IN :quizIds GROUP BY qa.quiz.id")
    List<Object[]> findStatsForQuizIds(@Param("quizIds") List<Long> quizIds);

    // ========== Paginated listing with fetch joins (N+1 prevention) ==========

    /**
     * Paginated attempts with user and quiz eagerly loaded.
     * Used by AdminService.getAllAttempts to prevent N+1.
     */
    @Query("SELECT qa FROM QuizAttempt qa " +
            "JOIN FETCH qa.user " +
            "JOIN FETCH qa.quiz " +
            "ORDER BY qa.attemptedAt DESC")
    Page<QuizAttempt> findAllWithUserAndQuiz(Pageable pageable);

    /**
     * Paginated teacher attempts with user and quiz eagerly loaded.
     * Used by DashboardService.getRecentAttempts to prevent N+1.
     */
    @Query("SELECT qa FROM QuizAttempt qa " +
            "JOIN FETCH qa.user " +
            "JOIN FETCH qa.quiz " +
            "WHERE qa.quiz.createdBy.id = :teacherId " +
            "ORDER BY qa.attemptedAt DESC")
    Page<QuizAttempt> findByQuizCreatedByIdWithUserAndQuiz(
            @Param("teacherId") Long teacherId, Pageable pageable);

    // ========== Analytics Queries ==========

    /**
     * Get all scores for a quiz (used for median / std-dev / histogram).
     * Note: score is Integer in QuizAttempt, return as Integer and convert in service.
     */
    @Query("SELECT qa.score FROM QuizAttempt qa WHERE qa.quiz.id = :quizId ORDER BY qa.score ASC")
    List<Integer> findAllScoresByQuizId(@Param("quizId") Long quizId);
}
