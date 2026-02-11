package com.tukaram.kasoti.dto;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for profile updates.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileUpdateRequest {
    private String name;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;
}
