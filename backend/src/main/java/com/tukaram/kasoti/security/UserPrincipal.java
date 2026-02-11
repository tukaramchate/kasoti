package com.tukaram.kasoti.security;

import com.tukaram.kasoti.model.Role;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Immutable principal holding authenticated user information extracted from JWT.
 */
@Getter
@RequiredArgsConstructor
public class UserPrincipal {

    private final Long id;
    private final String username;
    private final Role role;

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }

    public boolean isTeacher() {
        return role == Role.TEACHER;
    }

    public boolean isStudent() {
        return role == Role.STUDENT;
    }

    public boolean isTeacherOrAdmin() {
        return role == Role.ADMIN || role == Role.TEACHER;
    }
}
