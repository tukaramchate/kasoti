package com.tukaram.kasoti.controller;

import com.tukaram.kasoti.dto.AttemptSummaryDTO;
import com.tukaram.kasoti.dto.ChangePasswordRequest;
import com.tukaram.kasoti.dto.ProfileUpdateRequest;
import com.tukaram.kasoti.dto.UserDTO;
import com.tukaram.kasoti.security.UserPrincipal;
import com.tukaram.kasoti.service.AuthService;
import com.tukaram.kasoti.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "User profile and attempt history")
public class ProfileController {

    private final AuthService authService;
    private final QuizService quizService;

    @Operation(summary = "Get my profile", description = "Returns the authenticated user's profile")
    @ApiResponse(responseCode = "200", description = "User profile")
    @GetMapping
    public ResponseEntity<UserDTO> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(authService.getProfile(principal.getUsername()));
    }

    @Operation(summary = "Update my profile", description = "Update name, email, or phone number")
    @ApiResponse(responseCode = "200", description = "Profile updated")
    @PutMapping
    public ResponseEntity<UserDTO> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(authService.updateProfile(
                principal.getUsername(),
                request.getName(),
                request.getEmail(),
                request.getPhone()));
    }

    @Operation(summary = "Change password", description = "Change the authenticated user's password")
    @ApiResponse(responseCode = "200", description = "Password changed")
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(
                principal.getUsername(),
                request.getCurrentPassword(),
                request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @Operation(summary = "Get my attempts", description = "List all quiz attempts by the authenticated user")
    @ApiResponse(responseCode = "200", description = "List of attempts")
    @GetMapping("/attempts")
    public ResponseEntity<List<AttemptSummaryDTO>> getMyAttempts(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.getUserAttempts(principal.getId()));
    }

    @Operation(summary = "Get my attempts (paginated)", description = "Paginated list of quiz attempts")
    @ApiResponse(responseCode = "200", description = "Page of attempts")
    @GetMapping("/attempts/paginated")
    public ResponseEntity<Page<AttemptSummaryDTO>> getMyAttemptsPaginated(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(quizService.getUserAttemptsPaginated(principal.getId(), page, size));
    }
}
