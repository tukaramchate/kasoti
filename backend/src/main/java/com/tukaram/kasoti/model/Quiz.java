package com.tukaram.kasoti.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "quiz")
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "quiz_seq")
    @SequenceGenerator(name = "quiz_seq", sequenceName = "quiz_id_seq", allocationSize = 1)
    private Long id;

    @NotBlank(message = "Title is required")
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @JsonIgnoreProperties({
            "hibernateLazyInitializer", "handler",
            "password", // already ignored — belt-and-suspenders
            "email", // PII — not needed in exported quiz JSON
            "phone", // PII — not needed in exported quiz JSON
            "createdAt", // internal timestamp — not needed
            "updatedAt" // internal timestamp — not needed
    })
    @ToString.Exclude
    private User createdBy;

    @Column
    @Builder.Default
    private String category = "General";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Status is required")
    @Builder.Default
    private QuizStatus status = QuizStatus.DRAFT;

    @Column(name = "share_code", unique = true)
    private String shareCode;

    /**
     * Time limit in minutes for completing the quiz.
     * Null means no time limit.
     */
    @Min(value = 1, message = "Time limit must be at least 1 minute")
    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;

    /**
     * When the quiz becomes available to students.
     * Null means immediately available once published.
     */
    @Column(name = "start_time")
    private LocalDateTime startTime;

    /**
     * When the quiz is no longer available.
     * Null means no end date.
     */
    @Column(name = "end_time")
    private LocalDateTime endTime;

    // ========== Quiz Settings ==========

    /**
     * Enable negative marking for wrong answers.
     * Default: false (no penalty for wrong answers).
     */
    @Column(name = "negative_marking")
    @Builder.Default
    private Boolean negativeMarking = false;

    /**
     * Shuffle question order for each student.
     * Default: false (questions shown in original order).
     */
    @Column(name = "shuffle_questions")
    @Builder.Default
    private Boolean shuffleQuestions = false;

    /**
     * Shuffle answer options for each question.
     * Default: false (options shown in original order).
     */
    @Column(name = "shuffle_options")
    @Builder.Default
    private Boolean shuffleOptions = false;

    /**
     * Require students to take the quiz in browser full-screen mode.
     * When enabled, students must enter full-screen before answering.
     * Exiting full-screen triggers a warning; repeated violations auto-submit.
     * Default: false.
     */
    @Column(name = "full_screen_required")
    @Builder.Default
    private Boolean fullScreenRequired = false;

    /**
     * Minimum percentage required to pass the quiz.
     * Null means no pass/fail threshold.
     */
    @Min(value = 0, message = "Pass percentage cannot be negative")
    @Max(value = 100, message = "Pass percentage cannot exceed 100")
    @Column(name = "pass_percentage")
    private Integer passPercentage;

    /**
     * Difficulty level of the quiz.
     * Values: EASY, MEDIUM, HARD
     */
    @Column(name = "difficulty", length = 10)
    private String difficulty;

    /**
     * Comma-separated tags for better quiz discovery.
     * Example: "java,spring,testing"
     */
    @Column(name = "tags", length = 500)
    private String tags;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "quiz_id")
    private List<Question> questions;

    /**
     * Check if the quiz is currently available based on status and start/end times.
     */
    public boolean isAvailable() {
        if (status != QuizStatus.PUBLISHED) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        if (startTime != null && now.isBefore(startTime)) {
            return false;
        }
        if (endTime != null && now.isAfter(endTime)) {
            return false;
        }
        return true;
    }

    /**
     * Check if the quiz is in draft mode.
     */
    public boolean isDraft() {
        return status == QuizStatus.DRAFT;
    }

    /**
     * Check if the quiz is published.
     */
    public boolean isPublished() {
        return status == QuizStatus.PUBLISHED;
    }

    /**
     * Check if the quiz is closed.
     */
    public boolean isClosed() {
        return status == QuizStatus.CLOSED;
    }

    /**
     * Calculate total marks for this quiz.
     */
    public int getTotalMarks() {
        if (questions == null || questions.isEmpty()) {
            return 0;
        }
        return questions.stream()
                .mapToInt(q -> q.getMarks() != null ? q.getMarks() : 1)
                .sum();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Quiz quiz = (Quiz) o;
        return id != null && id.equals(quiz.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
