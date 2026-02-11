package com.tukaram.kasoti.config;

import com.tukaram.kasoti.model.Role;
import com.tukaram.kasoti.model.User;
import com.tukaram.kasoti.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

/**
 * Database initialization configuration.
 * Creates default admin accounts if they don't exist.
 * Set ADMIN_PASSWORD environment variable to override the default password.
 */
@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String adminPassword = System.getenv().getOrDefault("ADMIN_PASSWORD", "Admin@123");

            // Define admin accounts to create
            List<AdminAccount> adminAccounts = List.of(
                    new AdminAccount("admin", "System Administrator", "admin@quizapp.com", "1234567890"),
                    new AdminAccount("superadmin", "Super Admin", "superadmin@quizapp.com", "9876543210"));

            // Create admin accounts if they don't exist
            int created = 0;
            for (AdminAccount account : adminAccounts) {
                if (!userRepository.findByUsername(account.username).isPresent()) {
                    userRepository.save(User.builder()
                            .name(account.name)
                            .username(account.username)
                            .email(account.email)
                            .password(passwordEncoder.encode(adminPassword))
                            .phone(account.phone)
                            .role(Role.ADMIN)
                            .build());
                    log.info("Created admin account: {}", account.username);
                    created++;
                }
            }

            if (created > 0) {
                log.info("Database initialization complete. Created {} admin account(s).", created);
            } else {
                log.info("Database initialization complete. All admin accounts already exist.");
            }
        };
    }

    /**
     * Helper record to store admin account details.
     */
    private record AdminAccount(String username, String name, String email, String phone) {
    }
}
