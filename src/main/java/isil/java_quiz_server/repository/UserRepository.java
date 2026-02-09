package isil.java_quiz_server.repository;

import isil.java_quiz_server.model.Role;
import isil.java_quiz_server.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    // Role-based queries
    List<User> findByRole(Role role);

    Page<User> findByRole(Role role, Pageable pageable);

    long countByRole(Role role);

    // Search queries for admin
    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String username, String email, Pageable pageable);
}
