package com.tukaram.kasoti.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @ElementCollection
    @CollectionTable(name = "question_option", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "options")
    private List<String> options;

    @NotNull(message = "Correct option is required")
    @Column(name = "correct_option", nullable = false)
    private String correctOption;

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
