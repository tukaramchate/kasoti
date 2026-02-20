package com.tukaram.kasoti.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "question")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "question_seq")
    @SequenceGenerator(name = "question_seq", sequenceName = "question_id_seq", allocationSize = 1)
    private Long id;

    @NotBlank(message = "Question text is required")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    /**
     * Question type — defaults to MCQ for full backward compatibility.
     * Existing questions without this field will be treated as MCQ.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", length = 20)
    @Builder.Default
    private QuestionType questionType = QuestionType.MCQ;

    /**
     * Answer options for MCQ, MSQ, and TRUE_FALSE.
     * DESCRIPTIVE questions must have an empty/null options list.
     */
    @ElementCollection
    @CollectionTable(name = "question_option", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "options")
    private List<String> options;

    /**
     * Single correct option for MCQ and TRUE_FALSE.
     * Kept for backward compatibility with existing data.
     * For MSQ, use {@link #correctOptions} instead.
     * For DESCRIPTIVE, this field is null.
     */
    @Column(name = "correct_option")
    private String correctOption;

    /**
     * Multiple correct options for MSQ questions.
     * Null/empty for MCQ, TRUE_FALSE, and DESCRIPTIVE.
     */
    @ElementCollection
    @CollectionTable(name = "question_correct_option", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "correct_option")
    private List<String> correctOptions;

    /**
     * Reference/model answer for DESCRIPTIVE questions.
     * Teachers can use this as an evaluation guide.
     * Null for MCQ, MSQ, and TRUE_FALSE.
     */
    @Column(name = "model_answer", columnDefinition = "TEXT")
    private String modelAnswer;

    /**
     * Keywords that should appear in a DESCRIPTIVE answer (comma-separated).
     * Optional — used for auto-hint during manual evaluation.
     */
    @Size(max = 1000, message = "Keywords must be at most 1000 characters")
    @Column(name = "keywords", length = 1000)
    private String keywords;

    @Min(value = 1, message = "Marks must be at least 1")
    @Column(nullable = false)
    @Builder.Default
    private Integer marks = 1;

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Question question = (Question) o;
        return id != null && id.equals(question.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
