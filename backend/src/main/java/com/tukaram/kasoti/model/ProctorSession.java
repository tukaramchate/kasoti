package com.tukaram.kasoti.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a single proctoring session tied to one student's quiz attempt.
 * Reference face image is stored as BYTEA directly in PostgreSQL.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "proctor_session",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_proctor_user_quiz",
                columnNames = {"user_id", "quiz_id"}))
public class ProctorSession {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "proctor_session_seq")
    @SequenceGenerator(name = "proctor_session_seq", sequenceName = "proctor_session_id_seq", allocationSize = 1)
    private Long id;

    // ── Ownership ─────────────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @ToString.Exclude
    private Quiz quiz;

    // ── Reference face image stored as BYTEA ──────────────────────────────────
    @Lob
    @Column(name = "reference_image", columnDefinition = "BYTEA")
    private byte[] referenceImage;

    // ── Warning tracking ──────────────────────────────────────────────────────
    @Builder.Default
    @Column(name = "warning_count", nullable = false)
    private Integer warningCount = 0;

    @Builder.Default
    @Column(name = "warning_limit", nullable = false)
    private Integer warningLimit = 3;

    // ── Session lifecycle ─────────────────────────────────────────────────────
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProctoringStatus status = ProctoringStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ── Violations ────────────────────────────────────────────────────────────
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    private List<ProctorViolation> violations = new ArrayList<>();
}
