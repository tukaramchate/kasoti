package com.tukaram.kasoti.repository;

import com.tukaram.kasoti.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findByAttemptId(Long attemptId);

    List<Answer> findByQuestionId(Long questionId);

    void deleteByAttemptId(Long attemptId);

    // Delete ElementCollection rows for answers by quiz (must run BEFORE
    // deleteAllByQuizId)
    @Modifying
    @Query(value = "DELETE FROM answer_selected_option WHERE answer_id IN (SELECT a.id FROM answer a JOIN quiz_attempt qa ON a.attempt_id = qa.id WHERE qa.quiz_id = :quizId)", nativeQuery = true)
    void deleteSelectedOptionsByQuizId(@Param("quizId") Long quizId);

    // Bulk delete all answers for attempts on a specific quiz (native SQL to avoid
    // Hibernate ElementCollection auto-cleanup issues)
    @Modifying
    @Query(value = "DELETE FROM answer WHERE attempt_id IN (SELECT qa.id FROM quiz_attempt qa WHERE qa.quiz_id = :quizId)", nativeQuery = true)
    void deleteAllByQuizId(@Param("quizId") Long quizId);

    // Delete ElementCollection rows for answers by user (must run BEFORE
    // deleteAllByUserId)
    @Modifying
    @Query(value = "DELETE FROM answer_selected_option WHERE answer_id IN (SELECT a.id FROM answer a JOIN quiz_attempt qa ON a.attempt_id = qa.id WHERE qa.user_id = :userId)", nativeQuery = true)
    void deleteSelectedOptionsByUserId(@Param("userId") Long userId);

    // Bulk delete all answers for attempts by a specific user (native SQL to avoid
    // Hibernate ElementCollection auto-cleanup issues)
    @Modifying
    @Query(value = "DELETE FROM answer WHERE attempt_id IN (SELECT qa.id FROM quiz_attempt qa WHERE qa.user_id = :userId)", nativeQuery = true)
    void deleteAllByUserId(@Param("userId") Long userId);

    // Find all DESCRIPTIVE answers pending evaluation for a quiz
    @Query("SELECT a FROM Answer a " +
            "JOIN FETCH a.question q " +
            "JOIN FETCH a.attempt at " +
            "JOIN FETCH at.user " +
            "JOIN FETCH at.quiz " +
            "WHERE at.quiz.id = :quizId " +
            "AND a.evaluationStatus = 'PENDING' " +
            "ORDER BY at.attemptedAt ASC")
    List<Answer> findPendingDescriptiveByQuizId(@Param("quizId") Long quizId);

    // Count pending DESCRIPTIVE answers for a quiz
    @Query("SELECT COUNT(a) FROM Answer a WHERE a.attempt.quiz.id = :quizId AND a.evaluationStatus = 'PENDING'")
    long countPendingByQuizId(@Param("quizId") Long quizId);

    /**
     * Get the quiz creator ID for a given quizId — used to verify ownership even
     * when there are no pending answers (IDOR fix in EvaluationService).
     * Returns empty Optional if no quiz with this ID exists.
     */
    @Query("SELECT q.createdBy.id FROM Quiz q WHERE q.id = :quizId")
    Optional<Long> findQuizOwnerIdByQuizId(@Param("quizId") Long quizId);

    // ========== Analytics Queries ==========

    /**
     * Correct-answer count per question for a quiz.
     * Returns Object[] with [questionId, correctCount].
     */
    @Query("SELECT a.question.id, COUNT(a) FROM Answer a " +
            "WHERE a.attempt.quiz.id = :quizId AND a.isCorrect = true " +
            "GROUP BY a.question.id")
    List<Object[]> findCorrectCountsByQuizId(@Param("quizId") Long quizId);

    /**
     * Option distribution per question for single-option types (MCQ / TRUE_FALSE).
     * Returns Object[] with [questionId, selectedOption, count].
     */
    @Query("SELECT a.question.id, a.selectedOption, COUNT(a) FROM Answer a " +
            "WHERE a.attempt.quiz.id = :quizId AND a.selectedOption IS NOT NULL " +
            "GROUP BY a.question.id, a.selectedOption")
    List<Object[]> findSingleOptionDistributionByQuizId(@Param("quizId") Long quizId);

    /**
     * Option distribution per question for multi-option types (MSQ).
     * Uses the ElementCollection join table.
     * Returns Object[] with [questionId, selectedOption, count].
     */
    @Query(value = "SELECT a.question_id, aso.selected_option, COUNT(*) " +
            "FROM answer a " +
            "JOIN answer_selected_option aso ON aso.answer_id = a.id " +
            "JOIN quiz_attempt qa ON qa.id = a.attempt_id " +
            "WHERE qa.quiz_id = :quizId " +
            "GROUP BY a.question_id, aso.selected_option", nativeQuery = true)
    List<Object[]> findMultiOptionDistributionByQuizId(@Param("quizId") Long quizId);

    /**
     * Average time spent per question.
     * Returns Object[] with [questionId, avgTime].
     */
    @Query("SELECT a.question.id, AVG(a.timeSpentSeconds) FROM Answer a " +
            "WHERE a.attempt.quiz.id = :quizId AND a.timeSpentSeconds IS NOT NULL " +
            "GROUP BY a.question.id")
    List<Object[]> findAverageTimeByQuizId(@Param("quizId") Long quizId);

    /**
     * Marks distribution per question (for DESCRIPTIVE questions).
     * Returns Object[] with [questionId, marksObtained, count].
     */
    @Query("SELECT a.question.id, a.marksObtained, COUNT(a) FROM Answer a " +
            "WHERE a.attempt.quiz.id = :quizId AND a.marksObtained IS NOT NULL " +
            "GROUP BY a.question.id, a.marksObtained")
    List<Object[]> findMarksDistributionByQuizId(@Param("quizId") Long quizId);

    /**
     * Per-answer correctness paired with the attempt's total score.
     * Used to compute discrimination index (point-biserial correlation).
     * Returns Object[] with [questionId, isCorrect (boolean), attemptScore (double)].
     */
    @Query("SELECT a.question.id, a.isCorrect, a.attempt.score FROM Answer a " +
            "WHERE a.attempt.quiz.id = :quizId")
    List<Object[]> findCorrectnessWithScoresByQuizId(@Param("quizId") Long quizId);

    /**
     * Total answer count per question for a quiz.
     * Returns Object[] with [questionId, totalCount].
     */
    @Query("SELECT a.question.id, COUNT(a) FROM Answer a " +
            "WHERE a.attempt.quiz.id = :quizId " +
            "GROUP BY a.question.id")
    List<Object[]> findTotalCountsByQuizId(@Param("quizId") Long quizId);
}
