package com.tukaram.kasoti.repository;

import com.tukaram.kasoti.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findByAttemptId(Long attemptId);

    List<Answer> findByQuestionId(Long questionId);

    void deleteByAttemptId(Long attemptId);

    // Delete ElementCollection rows for answers by quiz (must run BEFORE deleteAllByQuizId)
    @Modifying
    @Query(value = "DELETE FROM answer_selected_option WHERE answer_id IN (SELECT a.id FROM answer a JOIN quiz_attempt qa ON a.attempt_id = qa.id WHERE qa.quiz_id = :quizId)", nativeQuery = true)
    void deleteSelectedOptionsByQuizId(@Param("quizId") Long quizId);

    // Bulk delete all answers for attempts on a specific quiz (native SQL to avoid Hibernate ElementCollection auto-cleanup issues)
    @Modifying
    @Query(value = "DELETE FROM answer WHERE attempt_id IN (SELECT qa.id FROM quiz_attempt qa WHERE qa.quiz_id = :quizId)", nativeQuery = true)
    void deleteAllByQuizId(@Param("quizId") Long quizId);

    // Delete ElementCollection rows for answers by user (must run BEFORE deleteAllByUserId)
    @Modifying
    @Query(value = "DELETE FROM answer_selected_option WHERE answer_id IN (SELECT a.id FROM answer a JOIN quiz_attempt qa ON a.attempt_id = qa.id WHERE qa.user_id = :userId)", nativeQuery = true)
    void deleteSelectedOptionsByUserId(@Param("userId") Long userId);

    // Bulk delete all answers for attempts by a specific user (native SQL to avoid Hibernate ElementCollection auto-cleanup issues)
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
}
