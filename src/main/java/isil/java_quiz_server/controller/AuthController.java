package isil.java_quiz_server.controller;

import isil.java_quiz_server.dto.AuthResponse;
import isil.java_quiz_server.dto.LoginRequest;
import isil.java_quiz_server.dto.PasswordResetConfirmRequest;
import isil.java_quiz_server.dto.PasswordResetRequest;
import isil.java_quiz_server.dto.RegisterRequest;
import isil.java_quiz_server.exception.BadRequestException;
import isil.java_quiz_server.exception.ResourceNotFoundException;
import isil.java_quiz_server.model.User;
import isil.java_quiz_server.repository.UserRepository;
import isil.java_quiz_server.service.AuthService;
import isil.java_quiz_server.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" })
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthService authService,
            PasswordResetService passwordResetService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Request a password reset token.
     * In production, the token would be sent via email.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody PasswordResetRequest request) {
        // Check if user exists
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        // Generate reset token
        String token = passwordResetService.generateResetToken(user.getEmail());

        // In production, send email with reset link
        // For now, return the token in response (for testing)
        return ResponseEntity.ok(Map.of(
                "message", "Password reset token generated. In production, check your email.",
                "token", token));
    }

    /**
     * Reset password using the token.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        // Validate token
        String email = passwordResetService.validateToken(request.getToken());
        if (email == null) {
            throw new BadRequestException("Invalid or expired reset token");
        }

        // Update user password
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Invalidate token
        passwordResetService.invalidateToken(request.getToken());

        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }
}
