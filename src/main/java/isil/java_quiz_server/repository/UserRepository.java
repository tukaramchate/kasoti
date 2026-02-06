package isil.java_quiz_server.repository;

import isil.java_quiz_server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    // Keep old method for backward compatibility (will be removed later)
    User findByUsernameAndPassword(String username, String password);
}
