package isil.java_quiz_server.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "quiz")
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "quiz_seq")
    @SequenceGenerator(name = "quiz_seq", sequenceName = "quiz_id_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password" })
    private User createdBy;

    @Column
    private String category = "General";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuizStatus status = QuizStatus.DRAFT;

    @Column(name = "share_code", unique = true)
    private String shareCode;

    /**
     * Time limit in minutes for completing the quiz.
     * Null means no time limit.
     */
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

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "quiz_id")
    private List<Question> questions;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public QuizStatus getStatus() {
        return status;
    }

    public void setStatus(QuizStatus status) {
        this.status = status;
    }

    public String getShareCode() {
        return shareCode;
    }

    public void setShareCode(String shareCode) {
        this.shareCode = shareCode;
    }

    public Integer getTimeLimitMinutes() {
        return timeLimitMinutes;
    }

    public void setTimeLimitMinutes(Integer timeLimitMinutes) {
        this.timeLimitMinutes = timeLimitMinutes;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<Question> getQuestions() {
        return questions;
    }

    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }

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
}
