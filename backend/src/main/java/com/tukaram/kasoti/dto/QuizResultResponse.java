package com.tukaram.kasoti.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for quiz results.
 * Now includes descriptivePending count for quizzes with DESCRIPTIVE questions.
 */
@Data
@NoArgsConstructor
public class QuizResultResponse {

    private Long quizId;
    private String quizTitle;
    private Integer score;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Integer marksObtained;
    private Integer totalMarks;
    private Boolean passed;
    private Double percentage;
    private Integer timeTakenSeconds;
    private LocalDateTime attemptedAt;
    private String message;
    private List<AnswerDTO> answers;

    /**
     * Number of DESCRIPTIVE questions awaiting manual evaluation.
     * Zero for quizzes without DESCRIPTIVE questions (backward compatible).
     */
    private int descriptivePending;

    /**
     * Legacy constructor — backward compatible with existing callers.
     */
    public QuizResultResponse(Long quizId, String quizTitle, Integer correctAnswers,
            Integer totalQuestions, Integer timeTakenSeconds,
            Integer marksObtained, Integer totalMarks, Boolean passed,
            List<AnswerDTO> answers) {
        this(quizId, quizTitle, correctAnswers, totalQuestions,
                timeTakenSeconds, marksObtained, totalMarks, passed, answers, 0);
    }

    /**
     * Full constructor including descriptive-pending count.
     */
    public QuizResultResponse(Long quizId, String quizTitle, Integer correctAnswers,
            Integer totalQuestions, Integer timeTakenSeconds,
            Integer marksObtained, Integer totalMarks, Boolean passed,
            List<AnswerDTO> answers, int descriptivePending) {
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.correctAnswers = correctAnswers;
        this.totalQuestions = totalQuestions;
        this.score = totalMarks != null && totalMarks > 0
                ? (int) Math.round((marksObtained * 100.0) / totalMarks) : 0;
        this.percentage = totalMarks != null && totalMarks > 0
                ? (marksObtained * 100.0) / totalMarks : 0.0;
        this.timeTakenSeconds = timeTakenSeconds;
        this.marksObtained = marksObtained;
        this.totalMarks = totalMarks;
        this.passed = passed;
        this.answers = answers;
        this.descriptivePending = descriptivePending;
        this.attemptedAt = LocalDateTime.now();
        this.message = generateMessage();
    }

    private String generateMessage() {
        if (descriptivePending > 0)
            return String.format("Submitted! %d descriptive question(s) pending manual evaluation.", descriptivePending);
        if (percentage >= 90)
            return "Excellent! Outstanding performance!";
        if (percentage >= 75)
            return "Great job! Well done!";
        if (percentage >= 50)
            return "Good effort! Keep practicing!";
        return "Don't give up! Try again!";
    }
}
