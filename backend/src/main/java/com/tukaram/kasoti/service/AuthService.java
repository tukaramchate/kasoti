package com.tukaram.kasoti.service;

import com.tukaram.kasoti.dto.AuthResponse;
import com.tukaram.kasoti.dto.LoginRequest;
import com.tukaram.kasoti.dto.RegisterRequest;
import com.tukaram.kasoti.dto.UserDTO;
import com.tukaram.kasoti.exception.AccountLockedException;
import com.tukaram.kasoti.exception.BadRequestException;
import com.tukaram.kasoti.exception.ResourceNotFoundException;
import com.tukaram.kasoti.exception.UnauthorizedException;
import com.tukaram.kasoti.model.Role;
import com.tukaram.kasoti.model.User;
import com.tukaram.kasoti.repository.UserRepository;
import com.tukaram.kasoti.security.JwtTokenProvider;
import com.tukaram.kasoti.security.LoginAttemptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginAttemptService loginAttemptService;
    private final PasswordResetService passwordResetService;

    /**
     * Register a new user with password hashing.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if username already exists
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new BadRequestException("Username already exists");
        }

        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        // Determine role - default STUDENT
        // ADMIN and TEACHER cannot be self-registered; must be assigned by admin
        Role role = request.getRole();
        if (role == null) {
            role = Role.STUDENT; // null check FIRST to avoid NPE on enum comparisons
        }
        if (role == Role.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be created through registration");
        }
        if (role == Role.TEACHER) {
            throw new BadRequestException("Teacher accounts require admin approval. Register as a student and contact an administrator.");
        }

        // Create new user with hashed password using builder
        User savedUser = userRepository.save(User.builder()
                .name(request.getName())
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(role)
                .build());

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(
                savedUser.getUsername(),
                savedUser.getId(),
                savedUser.getRole());

        return new AuthResponse(token, convertToDTO(savedUser), "Registration successful");
    }

    /**
     * Authenticate user and return JWT token.
     */
    public AuthResponse login(LoginRequest request) {
        String username = request.getUsername();

        // Check if account is locked
        if (loginAttemptService.isLocked(username)) {
            long remainingMinutes = loginAttemptService.getRemainingLockTimeMinutes(username);
            throw new AccountLockedException(remainingMinutes);
        }

        // Find user by username
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    loginAttemptService.loginFailed(username);
                    return new UnauthorizedException("Invalid username or password");
                });

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            loginAttemptService.loginFailed(username);
            int remaining = loginAttemptService.getRemainingAttempts(username);
            if (remaining > 0) {
                throw new UnauthorizedException(
                        String.format("Invalid username or password. %d attempts remaining.", remaining));
            } else {
                throw new AccountLockedException(
                        loginAttemptService.getRemainingLockTimeMinutes(username));
            }
        }

        // Login successful - reset attempts
        loginAttemptService.loginSucceeded(username);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(
                user.getUsername(),
                user.getId(),
                user.getRole());

        return new AuthResponse(token, convertToDTO(user));
    }

    /**
     * Change user password.
     */
    @Transactional
    public void changePassword(String username, String currentPassword, String newPassword) {
        User user = findUserByUsername(username);

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    /**
     * Get user profile by username.
     */
    public UserDTO getProfile(String username) {
        return convertToDTO(findUserByUsername(username));
    }

    /**
     * Update user profile.
     */
    @Transactional
    public UserDTO updateProfile(String username, String name, String email, String phone) {
        User user = findUserByUsername(username);

        if (name != null) {
            user.setName(name);
        }

        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.findByEmail(email).isPresent()) {
                throw new BadRequestException("Email already exists");
            }
            user.setEmail(email);
        }

        if (phone != null) {
            user.setPhone(phone);
        }

        return convertToDTO(userRepository.save(user));
    }

    /**
     * Generate a password reset token for the given email.
     * Returns the token (in production, send via email instead).
     */
    public String forgotPassword(String email) {
        // Never reveal whether an email exists — return null silently if not found
        return userRepository.findByEmail(email)
                .map(user -> passwordResetService.generateResetToken(user.getEmail()))
                .orElse(null);
    }

    /**
     * Reset password using a valid reset token.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        String email = passwordResetService.validateToken(token);
        if (email == null) {
            throw new BadRequestException("Invalid or expired reset token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        passwordResetService.invalidateToken(token);
    }

    // ========== Helper Methods ==========

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .build();
    }
}
