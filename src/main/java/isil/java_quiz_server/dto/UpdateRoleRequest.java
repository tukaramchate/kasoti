package isil.java_quiz_server.dto;

import isil.java_quiz_server.model.Role;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for admin role changes.
 */
public class UpdateRoleRequest {
    @NotNull(message = "Role is required")
    private Role role;

    public UpdateRoleRequest() {
    }

    public UpdateRoleRequest(Role role) {
        this.role = role;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
