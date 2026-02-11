package com.tukaram.kasoti.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity to track quiz attempts and scores.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "quiz_attempt")
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "quiz_attempt_seq")
    @SequenceGenerator(name = "quiz_attempt_seq", sequenceName = "quiz_attempt_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password" })
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "questions" })
    private Quiz quiz;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "total_marks")
    private Integer totalMarks;

    @Column(name = "marks_obtained")
    private Integer marksObtained;

    @Column(name = "correct_answers")
    private Integer correctAnswers;

    @Column(name = "time_taken_seconds")
    private Integer timeTakenSeconds;

    @CreationTimestamp
    @Column(name = "attempted_at", updatable = false)
    private LocalDateTime attemptedAt;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({ "attempt" })
    private List<Answer> answers;

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        QuizAttempt that = (QuizAttempt) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
