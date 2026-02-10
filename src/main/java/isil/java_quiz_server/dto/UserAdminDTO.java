package isil.java_quiz_server.dto;

import isil.java_quiz_server.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for admin user management views.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAdminDTO {
    private Long id;
    private String name;
    private String username;
    private String email;
    private String phone;
    private Role role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
