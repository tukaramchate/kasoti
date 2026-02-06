package isil.java_quiz_server.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Data Transfer Object for User - excludes sensitive data like password.
 */
public class UserDTO {

    private Long id;
    private String username;
    private String email;
    private Long phone;

    @JsonProperty("is_teacher")
    private Boolean isTeacher;

    public UserDTO() {
    }

    public UserDTO(Long id, String username, String email, Long phone, Boolean isTeacher) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.phone = phone;
        this.isTeacher = isTeacher;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
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

    public Boolean getIsTeacher() {
        return isTeacher;
    }

    public void setIsTeacher(Boolean isTeacher) {
        this.isTeacher = isTeacher;
    }
}
