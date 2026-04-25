package com.tukaram.kasoti.dto;

import com.tukaram.kasoti.model.ViolationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for displaying a single violation entry in admin/teacher review logs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationLogDTO {

    private Long id;
    private Long sessionId;
    private Long userId;
    private String username;
    private Long quizId;
    private String quizTitle;
    private ViolationType violationType;
    private String severity;
    private LocalDateTime occurredAt;
    /** True if a frame image is available for this violation. */
    private boolean hasFrameImage;
}
