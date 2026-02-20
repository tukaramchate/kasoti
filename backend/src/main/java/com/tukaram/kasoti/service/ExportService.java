package com.tukaram.kasoti.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tukaram.kasoti.exception.ForbiddenException;
import com.tukaram.kasoti.model.Quiz;
import com.tukaram.kasoti.model.QuizAttempt;
import com.tukaram.kasoti.repository.QuizAttemptRepository;
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
    private final QuizAttemptRepository quizAttemptRepository;
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

        // Get all attempts for this quiz with user eagerly loaded (no N+1)
        List<QuizAttempt> attempts = quizAttemptRepository
                .findByQuizIdWithUserForExport(quizId);

        // Build CSV content
        StringBuilder csv = new StringBuilder();

        // CSV Header
        csv.append("Student Name,Student Email,Marks Obtained,Total Marks,Percentage,Submitted At,Time Taken (minutes)\n");

        // CSV Rows
        for (QuizAttempt attempt : attempts) {
            csv.append(escapeCsvValue(attempt.getUser().getName())).append(",");
            csv.append(escapeCsvValue(attempt.getUser().getEmail())).append(",");
            csv.append(attempt.getMarksObtained() != null ? attempt.getMarksObtained() : attempt.getScore()).append(",");
            csv.append(attempt.getTotalMarks() != null ? attempt.getTotalMarks() : attempt.getTotalQuestions()).append(",");

            // Percentage — score is already stored as 0-100
            double percentage = attempt.getScore() != null ? attempt.getScore() : 0;
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
     * Escape special characters in CSV values and prevent formula injection.
     * Prefixes dangerous characters (=, +, -, @, \t, \r) with a single quote
     * to neutralize them when opened in Excel/Google Sheets.
     */
    private String escapeCsvValue(String value) {
        if (value == null) return "";

        // Prevent CSV formula injection
        if (!value.isEmpty()) {
            char first = value.charAt(0);
            if (first == '=' || first == '+' || first == '-' || first == '@'
                    || first == '\t' || first == '\r') {
                value = "'" + value;
            }
        }

        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("'")) {
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
