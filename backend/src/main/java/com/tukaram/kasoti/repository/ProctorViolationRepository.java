package com.tukaram.kasoti.repository;

import com.tukaram.kasoti.model.ProctorViolation;
import com.tukaram.kasoti.model.ViolationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProctorViolationRepository extends JpaRepository<ProctorViolation, Long> {

    /** All violations for a session, ordered chronologically. */
    List<ProctorViolation> findBySessionIdOrderByOccurredAtAsc(Long sessionId);

    /** Count violations of a specific type within a session. */
    long countBySessionIdAndViolationType(Long sessionId, ViolationType type);
}
