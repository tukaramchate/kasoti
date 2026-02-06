package isil.java_quiz_server.dto;

/**
 * Response DTO for login - contains JWT token and user info (without password).
 */
public class AuthResponse {

    private String token;
    private String type = "Bearer";
    private UserDTO user;
    private String message;

    public AuthResponse() {
    }

    public AuthResponse(String token, UserDTO user) {
        this.token = token;
        this.user = user;
        this.message = "Login successful";
    }

    public AuthResponse(String message, boolean error) {
        this.message = message;
        this.token = null;
        this.user = null;
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
