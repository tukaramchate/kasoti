package com.tukaram.kasoti.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tukaram.kasoti.exception.ForbiddenException;
import com.tukaram.kasoti.model.Quiz;
import com.tukaram.kasoti.model.QuizAttempt;
import com.tukaram.kasoti.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service for handling quiz and attempt data exports.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExportService {

    private final QuizService quizService;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Export a quiz as JSON string.
     * Only the quiz creator or admin can export.
     */
    public String exportQuizAsJson(Long quizId, UserPrincipal principal) throws IOException {
        Quiz quiz = quizService.getQuizById(quizId);
        validateExportAccess(quiz, principal);
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(quiz);
    }

    /**
     * Export quiz attempts as CSV string.
     * Only the quiz creator or admin can export attempts.
     */
    public String exportAttemptsAsCsv(Long quizId, UserPrincipal principal) {
        Quiz quiz = quizService.getQuizById(quizId);
        validateExportAccess(quiz, principal);

        // Get all attempts for this quiz
        List<QuizAttempt> attempts = quizService.getQuizStudents(quizId, principal, "score_desc");

        // Build CSV content
        StringBuilder csv = new StringBuilder();

        // CSV Header
        csv.append("Student Name,Student Email,Score,Total Questions,Percentage,Submitted At,Time Taken (minutes)\n");

        // CSV Rows
        for (QuizAttempt attempt : attempts) {
            csv.append(escapeCsvValue(attempt.getUser().getName())).append(",");
            csv.append(escapeCsvValue(attempt.getUser().getEmail())).append(",");
            csv.append(attempt.getScore()).append(",");
            csv.append(attempt.getQuiz().getQuestions().size()).append(",");

            // Calculate percentage
            int totalQuestions = attempt.getQuiz().getQuestions().size();
            double percentage = totalQuestions > 0 ? (attempt.getScore() * 100.0 / totalQuestions) : 0;
            csv.append(String.format("%.2f", percentage)).append("%,");

            // Format attempted date
            String attemptedAt = attempt.getAttemptedAt() != null
                    ? attempt.getAttemptedAt().format(DATE_FORMATTER)
                    : "N/A";
            csv.append(escapeCsvValue(attemptedAt)).append(",");

            // Use time taken from timeTakenSeconds field if available
            String timeTaken = "N/A";
            if (attempt.getTimeTakenSeconds() != null) {
                long minutes = attempt.getTimeTakenSeconds() / 60;
                timeTaken = String.valueOf(minutes);
            }
            csv.append(timeTaken).append("\n");
        }

        return csv.toString();
    }

    /**
     * Escape special characters in CSV values.
     */
    private String escapeCsvValue(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    /**
     * Only quiz owner or admin can export.
     */
    private void validateExportAccess(Quiz quiz, UserPrincipal principal) {
        if (!principal.isAdmin() && !quiz.getCreatedBy().getId().equals(principal.getId())) {
            throw new ForbiddenException("You can only export your own quizzes");
        }
    }
}
