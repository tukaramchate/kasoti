package com.tukaram.kasoti.repository;

import com.tukaram.kasoti.model.ProctorSession;
import com.tukaram.kasoti.model.ProctoringStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProctorSessionRepository extends JpaRepository<ProctorSession, Long> {

    /** Find an active/existing session for a specific student and quiz. */
    Optional<ProctorSession> findByUserIdAndQuizId(Long userId, Long quizId);

    /** All sessions for admin review (paginated). */
    Page<ProctorSession> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Sessions for a specific quiz (teacher review). */
    Page<ProctorSession> findByQuizIdOrderByCreatedAtDesc(Long quizId, Pageable pageable);

    /** Sessions by status (e.g. find all TERMINATED exams). */
    Page<ProctorSession> findByStatus(ProctoringStatus status, Pageable pageable);

    /** Count violations for a session without fetching full entity. */
    @Query("SELECT s.warningCount FROM ProctorSession s WHERE s.id = :id")
    Optional<Integer> findWarningCountById(@Param("id") Long id);
}
