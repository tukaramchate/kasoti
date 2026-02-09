package isil.java_quiz_server.service;

import isil.java_quiz_server.dto.AuthResponse;
import isil.java_quiz_server.dto.LoginRequest;
import isil.java_quiz_server.dto.RegisterRequest;
import isil.java_quiz_server.dto.UserDTO;
import isil.java_quiz_server.exception.AccountLockedException;
import isil.java_quiz_server.exception.BadRequestException;
import isil.java_quiz_server.exception.ResourceNotFoundException;
import isil.java_quiz_server.exception.UnauthorizedException;
import isil.java_quiz_server.model.Role;
import isil.java_quiz_server.model.User;
import isil.java_quiz_server.repository.UserRepository;
import isil.java_quiz_server.security.JwtTokenProvider;
import isil.java_quiz_server.security.LoginAttemptService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginAttemptService loginAttemptService;

    public AuthService(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            LoginAttemptService loginAttemptService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.loginAttemptService = loginAttemptService;
    }

    /**
     * Register a new user with password hashing.
     */
    public AuthResponse register(RegisterRequest request) {
        // Check if username already exists
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new BadRequestException("Username already exists");
        }

        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        // Determine role - by default STUDENT, allow TEACHER registration
        // ADMIN can only be created by existing admin (handled elsewhere)
        Role role = request.getRole();
        if (role == Role.ADMIN) {
            // Regular registration cannot create admins
            throw new BadRequestException("Admin accounts cannot be created through registration");
        }
        if (role == null) {
            role = Role.STUDENT;
        }

        // Create new user with hashed password
        User user = new User();
        user.setName(request.getName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Hash password!
        user.setPhone(request.getPhone());
        user.setRole(role);

        User savedUser = userRepository.save(user);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(
                savedUser.getUsername(),
                savedUser.getId(),
                savedUser.getRole());

        // Return response with token and user DTO (no password)
        UserDTO userDTO = convertToDTO(savedUser);
        return new AuthResponse(token, userDTO);
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

        // Return response with token and user DTO (no password)
        UserDTO userDTO = convertToDTO(user);
        return new AuthResponse(token, userDTO);
    }

    /**
     * Change user password.
     */
    public void changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    /**
     * Get user profile by username.
     */
    public UserDTO getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return convertToDTO(user);
    }

    /**
     * Update user profile.
     */
    public UserDTO updateProfile(String username, String name, String email, Long phone) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // Update name if provided
        if (name != null) {
            user.setName(name);
        }

        // Check if email already exists for another user
        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.findByEmail(email).isPresent()) {
                throw new BadRequestException("Email already exists");
            }
            user.setEmail(email);
        }

        if (phone != null) {
            user.setPhone(phone);
        }

        User updatedUser = userRepository.save(user);
        return convertToDTO(updatedUser);
    }

    /**
     * Convert User entity to UserDTO (excludes password).
     */
    private UserDTO convertToDTO(User user) {
        return new UserDTO(
                user.getId(),
                user.getName(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getRole());
    }
}
