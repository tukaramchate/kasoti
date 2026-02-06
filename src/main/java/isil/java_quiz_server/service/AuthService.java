package isil.java_quiz_server.service;

import isil.java_quiz_server.dto.AuthResponse;
import isil.java_quiz_server.dto.LoginRequest;
import isil.java_quiz_server.dto.RegisterRequest;
import isil.java_quiz_server.dto.UserDTO;
import isil.java_quiz_server.exception.BadRequestException;
import isil.java_quiz_server.exception.UnauthorizedException;
import isil.java_quiz_server.modal.User;
import isil.java_quiz_server.repository.UserRepository;
import isil.java_quiz_server.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
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

        // Create new user with hashed password
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Hash password!
        user.setPhone(request.getPhone());
        user.setIs_teacher(request.getIsTeacher() != null ? request.getIsTeacher() : false);

        User savedUser = userRepository.save(user);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(
                savedUser.getUsername(),
                savedUser.getId(),
                savedUser.getIs_teacher());

        // Return response with token and user DTO (no password)
        UserDTO userDTO = convertToDTO(savedUser);
        return new AuthResponse(token, userDTO);
    }

    /**
     * Authenticate user and return JWT token.
     */
    public AuthResponse login(LoginRequest request) {
        // Find user by username
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid username or password");
        }

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(
                user.getUsername(),
                user.getId(),
                user.getIs_teacher());

        // Return response with token and user DTO (no password)
        UserDTO userDTO = convertToDTO(user);
        return new AuthResponse(token, userDTO);
    }

    /**
     * Convert User entity to UserDTO (excludes password).
     */
    private UserDTO convertToDTO(User user) {
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getIs_teacher());
    }
}
