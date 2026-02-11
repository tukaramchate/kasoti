package com.tukaram.kasoti.dto;

import com.tukaram.kasoti.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for User that excludes sensitive information like the password.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String name;
    private String username;
    private String email;
    private String phone;
    private Role role;
}
