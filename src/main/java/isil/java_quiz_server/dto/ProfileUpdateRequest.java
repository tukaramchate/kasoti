package isil.java_quiz_server.dto;

import jakarta.validation.constraints.Email;

/**
 * Request DTO for profile updates.
 */
public class ProfileUpdateRequest {
    private String name;

    @Email(message = "Invalid email format")
    private String email;

    private Long phone;

    public ProfileUpdateRequest() {
    }

    public ProfileUpdateRequest(String name, String email, Long phone) {
        this.name = name;
        this.email = email;
        this.phone = phone;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getPhone() {
        return phone;
    }

    public void setPhone(Long phone) {
        this.phone = phone;
    }
}
