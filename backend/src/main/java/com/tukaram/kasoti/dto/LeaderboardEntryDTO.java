package com.tukaram.kasoti.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for public leaderboard entries — exposes only safe fields.
 * Prevents leaking email, phone, and other PII from User entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardEntryDTO {
    private Long attemptId;
    private String username;
    private Integer score;
    private Integer marksObtained;
    private Integer totalMarks;
    private Integer correctAnswers;
    private Integer totalQuestions;
    private Integer timeTakenSeconds;
    private LocalDateTime attemptedAt;
}
