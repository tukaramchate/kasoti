package isil.java_quiz_server.controller;

import isil.java_quiz_server.dto.ChangePasswordRequest;
import isil.java_quiz_server.dto.ProfileUpdateRequest;
import isil.java_quiz_server.dto.UserDTO;
import isil.java_quiz_server.model.QuizAttempt;
import isil.java_quiz_server.security.UserPrincipal;
import isil.java_quiz_server.service.AuthService;
import isil.java_quiz_server.service.QuizService;
import jakarta.validation.Valid;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final AuthService authService;
    private final QuizService quizService;

    public ProfileController(AuthService authService, QuizService quizService) {
        this.authService = authService;
        this.quizService = quizService;
    }

    @GetMapping
    public ResponseEntity<UserDTO> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(authService.getProfile(principal.getUsername()));
    }

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

    @GetMapping("/attempts")
    public ResponseEntity<List<QuizAttempt>> getMyAttempts(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.getUserAttempts(principal.getId()));
    }

    @GetMapping("/attempts/paginated")
    public ResponseEntity<Page<QuizAttempt>> getMyAttemptsPaginated(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(quizService.getUserAttemptsPaginated(principal.getId(), page, size));
    }
}
