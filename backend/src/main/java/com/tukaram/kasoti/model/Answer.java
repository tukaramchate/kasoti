package com.tukaram.kasoti.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

/**
 * Entity to track individual question answers within a quiz attempt.
 * Supports MCQ, MSQ, TRUE_FALSE, and DESCRIPTIVE answer types.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "answer")
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "answer_seq")
    @SequenceGenerator(name = "answer_seq", sequenceName = "answer_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "answers" })
    @ToString.Exclude
    private QuizAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ToString.Exclude
    private Question question;

    // ========== Single-option answers (MCQ, TRUE_FALSE) ==========

    /**
     * Selected option for MCQ and TRUE_FALSE questions.
     * Null for MSQ and DESCRIPTIVE.
     */
    @Column(name = "selected_option")
    private String selectedOption;

    // ========== Multi-option answers (MSQ) ==========

    /**
     * Selected options for MSQ questions.
     * Null/empty for MCQ, TRUE_FALSE, and DESCRIPTIVE.
     */
    @ElementCollection
    @CollectionTable(name = "answer_selected_option", joinColumns = @JoinColumn(name = "answer_id"))
    @Column(name = "selected_option")
    private List<String> selectedOptions;

    // ========== Text answers (DESCRIPTIVE) ==========

    /**
     * Free-text answer for DESCRIPTIVE questions.
     * Null for MCQ, MSQ, and TRUE_FALSE.
     */
    @Column(name = "text_answer", columnDefinition = "TEXT")
    private String textAnswer;

    // ========== Grading fields ==========

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "marks_obtained")
    @Builder.Default
    private Integer marksObtained = 0;

    /**
     * Evaluation status — AUTO_GRADED for objective types, PENDING/EVALUATED for DESCRIPTIVE.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "evaluation_status", length = 20)
    @Builder.Default
    private EvaluationStatus evaluationStatus = EvaluationStatus.AUTO_GRADED;

    /**
     * Teacher's feedback comment for manually evaluated answers.
     * Null for auto-graded answers.
     */
    @Column(name = "evaluation_comment", columnDefinition = "TEXT")
    private String evaluationComment;

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Answer answer = (Answer) o;
        return id != null && id.equals(answer.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
