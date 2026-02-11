package com.tukaram.kasoti.controller;

import com.tukaram.kasoti.dto.AuthResponse;
import com.tukaram.kasoti.dto.LoginRequest;
import com.tukaram.kasoti.dto.PasswordResetConfirmRequest;
import com.tukaram.kasoti.dto.PasswordResetRequest;
import com.tukaram.kasoti.dto.RegisterRequest;
import com.tukaram.kasoti.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return new ResponseEntity<>(authService.register(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody PasswordResetRequest request) {
        String token = authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of(
                "message", "Password reset token generated. In production, check your email.",
                "token", token));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }
}
