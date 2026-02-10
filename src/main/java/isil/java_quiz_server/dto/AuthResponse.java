package isil.java_quiz_server.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for login - contains JWT token and user info (without password).
 */
@Data
@NoArgsConstructor
public class AuthResponse {

    private String token;
    private String type = "Bearer";
    private UserDTO user;
    private String message;

    public AuthResponse(String token, UserDTO user) {
        this.token = token;
        this.user = user;
        this.message = "Login successful";
    }

    public AuthResponse(String token, UserDTO user, String message) {
        this.token = token;
        this.user = user;
        this.message = message;
    }

    public AuthResponse(String message, boolean error) {
        this.message = message;
        this.token = null;
        this.user = null;
    }
}
