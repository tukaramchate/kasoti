package isil.java_quiz_server.security;

/**
 * Principal object that holds authenticated user information.
 */
public class UserPrincipal {

    private final Long id;
    private final String username;
    private final Boolean isTeacher;

    public UserPrincipal(Long id, String username, Boolean isTeacher) {
        this.id = id;
        this.username = username;
        this.isTeacher = isTeacher;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public Boolean getIsTeacher() {
        return isTeacher;
    }
}
