package isil.java_quiz_server.config;

import isil.java_quiz_server.model.Role;
import isil.java_quiz_server.model.User;
import isil.java_quiz_server.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

/**
 * Database initialization configuration.
 * Creates default admin accounts if they don't exist.
 */
@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Define admin accounts to create
            List<AdminAccount> adminAccounts = List.of(
                    new AdminAccount("admin", "System Administrator", "admin@quizapp.com", "1234567890"),
                    new AdminAccount("superadmin", "Super Admin", "superadmin@quizapp.com", "9876543210"));

            // Create admin accounts if they don't exist
            int created = 0;
            for (AdminAccount account : adminAccounts) {
                if (!userRepository.findByUsername(account.username).isPresent()) {
                    User admin = new User();
                    admin.setName(account.name);
                    admin.setUsername(account.username);
                    admin.setEmail(account.email);
                    admin.setPassword(passwordEncoder.encode("Admin@123"));
                    admin.setPhone(account.phone);
                    admin.setRole(Role.ADMIN);
                    userRepository.save(admin);
                    System.out.println("✅ Created admin account: " + account.username + " / Admin@123");
                    created++;
                }
            }

            if (created > 0) {
                System.out.println("📊 Database initialization complete! Created " + created + " admin account(s).");
            } else {
                System.out.println("📊 Database initialization complete! All admin accounts already exist.");
            }
        };
    }

    /**
     * Helper record to store admin account details.
     */
    private record AdminAccount(String username, String name, String email, String phone) {
    }
}
