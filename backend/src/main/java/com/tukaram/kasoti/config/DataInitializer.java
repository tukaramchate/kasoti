package com.tukaram.kasoti.config;

import com.tukaram.kasoti.model.Role;
import com.tukaram.kasoti.model.User;
import com.tukaram.kasoti.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
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
     * Backfill existing rows that have NULL question_type / evaluation_status
     * after the multi-type question upgrade.
     */
    @Bean
    @Order(1)
    CommandLineRunner migrateQuestionTypes(JdbcTemplate jdbc) {
        return args -> {
            // ------------------------------------------------------------------
            // Fix stale NOT NULL constraints left behind by ddl-auto=update.
            // Hibernate's "update" mode adds columns/tables but NEVER drops
            // existing constraints. When the Question entity was originally
            // created, correct_option may have been NOT NULL. After the
            // multi-type upgrade, MSQ and DESCRIPTIVE questions need it nullable.
            // ------------------------------------------------------------------
            try {
                jdbc.execute("ALTER TABLE question ALTER COLUMN correct_option DROP NOT NULL");
                log.info("Migration: dropped NOT NULL on question.correct_option");
            } catch (Exception e) {
                // Column already nullable or doesn't exist — safe to ignore
                log.debug("Migration: correct_option already nullable or missing: {}", e.getMessage());
            }

            // Ensure new columns exist (ddl-auto may have failed if prior
            // ALTER on the same table errored during the same transaction)
            String[][] columns = {
                {"question_type", "ALTER TABLE question ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) DEFAULT 'MCQ'"},
                {"model_answer",  "ALTER TABLE question ADD COLUMN IF NOT EXISTS model_answer TEXT"},
                {"keywords",      "ALTER TABLE question ADD COLUMN IF NOT EXISTS keywords VARCHAR(1000)"},
            };
            for (String[] col : columns) {
                try {
                    jdbc.execute(col[1]);
                } catch (Exception e) {
                    log.debug("Migration: column {} already exists: {}", col[0], e.getMessage());
                }
            }

            // Ensure collection tables exist for MSQ correct options
            try {
                jdbc.execute("""
                    CREATE TABLE IF NOT EXISTS question_correct_option (
                        question_id BIGINT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
                        correct_option VARCHAR(255)
                    )
                    """);
            } catch (Exception e) {
                log.debug("Migration: question_correct_option table already exists: {}", e.getMessage());
            }

            // Backfill NULL question_type and evaluation_status
            int q = jdbc.update("UPDATE question SET question_type = 'MCQ' WHERE question_type IS NULL");
            int a = jdbc.update("UPDATE answer SET evaluation_status = 'AUTO_GRADED' WHERE evaluation_status IS NULL");
            if (q > 0 || a > 0) {
                log.info("Migration: backfilled {} questions and {} answers with default types.", q, a);
            }
        };
    }

    /**
     * Helper record to store admin account details.
     */
    private record AdminAccount(String username, String name, String email, String phone) {
    }
}
