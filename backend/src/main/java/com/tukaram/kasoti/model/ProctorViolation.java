package com.tukaram.kasoti.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Records a single violation event within a proctoring session.
 * The offending webcam frame is optionally stored as BYTEA.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "proctor_violation")
public class ProctorViolation {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "proctor_violation_seq")
    @SequenceGenerator(name = "proctor_violation_seq", sequenceName = "proctor_violation_id_seq", allocationSize = 1)
    private Long id;

    // ── Owning session ────────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @ToString.Exclude
    private ProctorSession session;

    // ── Violation details ─────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "violation_type", nullable = false, length = 30)
    private ViolationType violationType;

    /**
     * LOW  — informational (e.g. brief face absence)
     * HIGH — serious (phone detected, face mismatch, multiple persons)
     */
    @Builder.Default
    @Column(nullable = false, length = 10)
    private String severity = "LOW";

    @CreationTimestamp
    @Column(name = "occurred_at", updatable = false)
    private LocalDateTime occurredAt;

    // ── Optional: store offending frame as BYTEA for evidence ─────────────────
    @Lob
    @Column(name = "frame_image", columnDefinition = "BYTEA")
    private byte[] frameImage;
}
