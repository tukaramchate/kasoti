package isil.java_quiz_server.security;

import isil.java_quiz_server.model.Role;

/**
 * Custom principal to hold authenticated user information.
 */
public class UserPrincipal {

    private final Long id;
    private final String username;
    private final Role role;

    public UserPrincipal(Long id, String username, Role role) {
        this.id = id;
        this.username = username;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public Role getRole() {
        return role;
    }

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
