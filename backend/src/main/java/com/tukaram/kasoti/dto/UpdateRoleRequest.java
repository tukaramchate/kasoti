package com.tukaram.kasoti.dto;

import com.tukaram.kasoti.model.Role;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for admin role changes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRoleRequest {
    @NotNull(message = "Role is required")
    private Role role;
}
