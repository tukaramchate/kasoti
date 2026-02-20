package com.tukaram.kasoti.repository;

import com.tukaram.kasoti.model.Quiz;
import com.tukaram.kasoti.model.QuizStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

        // Listing queries — NO @EntityGraph to avoid loading all questions for every quiz

        List<Quiz> findAll();

        @EntityGraph(attributePaths = { "questions" })
        Optional<Quiz> findById(Long id);

        // Find by share code for public access (needs questions for quiz taking)
        @EntityGraph(attributePaths = { "questions" })
        Optional<Quiz> findByShareCode(String shareCode);

        // Find quizzes by creator (listing — no questions)
        List<Quiz> findByCreatedById(Long userId);

        Page<Quiz> findByCreatedById(Long userId, Pageable pageable);

        // Find by category (listing — no questions)
        List<Quiz> findByCategory(String category);

        // Find by status (listing/counting — no questions)
        List<Quiz> findByStatus(QuizStatus status);

        Page<Quiz> findByStatus(QuizStatus status, Pageable pageable);

        // Find by status and creator
        Page<Quiz> findByStatusAndCreatedById(QuizStatus status, Long userId, Pageable pageable);

        // ========== Pagination Methods ==========

        Page<Quiz> findAll(Pageable pageable);

        Page<Quiz> findByCategory(String category, Pageable pageable);

        // ========== Available Quizzes by Category (for students) ==========

        // ========== Unified Search (listing — no @EntityGraph) ==========

        /**
         * Single unified query that replaces 7 separate listing/search queries.
         * All parameters are optional — when empty they become no-ops.
         */
        @Query("SELECT q FROM Quiz q WHERE q.status = 'PUBLISHED' AND " +
                        "(:search = '' OR LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
                        "(:category = '' OR q.category = :category) AND " +
                        "(:difficulty = '' OR q.difficulty = :difficulty) AND " +
                        "(:tags = '' OR q.tags LIKE CONCAT('%', :tags, '%')) AND " +
                        "(q.startTime IS NULL OR q.startTime <= :now) AND " +
                        "(q.endTime IS NULL OR q.endTime >= :now)")
        Page<Quiz> findAvailableWithFilters(
                        @Param("search") String search,
                        @Param("category") String category,
                        @Param("difficulty") String difficulty,
                        @Param("tags") String tags,
                        @Param("now") LocalDateTime now,
                        Pageable pageable);

        // ========== Search Methods (listing — no @EntityGraph) ==========

        @Query("SELECT q FROM Quiz q WHERE LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%'))")
        Page<Quiz> searchByTitle(@Param("search") String search, Pageable pageable);

        @Query("SELECT q FROM Quiz q WHERE q.status = 'PUBLISHED' AND " +
                        "LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%')) AND q.category = :category AND " +
                        "(q.startTime IS NULL OR q.startTime <= :now) AND " +
                        "(q.endTime IS NULL OR q.endTime >= :now)")
        Page<Quiz> searchByTitleAndCategory(@Param("search") String search, @Param("category") String category,
                        @Param("now") LocalDateTime now, Pageable pageable);

        @Query("SELECT q FROM Quiz q WHERE q.status = 'PUBLISHED' AND " +
                        "(LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(q.category) LIKE LOWER(CONCAT('%', :search, '%'))) AND "
                        +
                        "(q.startTime IS NULL OR q.startTime <= :now) AND " +
                        "(q.endTime IS NULL OR q.endTime >= :now)")
        Page<Quiz> searchQuizzes(@Param("search") String search, @Param("now") LocalDateTime now, Pageable pageable);

        // ========== Available Quizzes for Students (listing — no @EntityGraph) ==========

        @Query("SELECT q FROM Quiz q WHERE q.status = 'PUBLISHED' AND " +
                        "(q.startTime IS NULL OR q.startTime <= :now) AND " +
                        "(q.endTime IS NULL OR q.endTime >= :now)")
        List<Quiz> findAvailableQuizzes(@Param("now") LocalDateTime now);

        @Query("SELECT q FROM Quiz q WHERE q.status = 'PUBLISHED' AND " +
                        "(q.startTime IS NULL OR q.startTime <= :now) AND " +
                        "(q.endTime IS NULL OR q.endTime >= :now)")
        Page<Quiz> findAvailableQuizzes(@Param("now") LocalDateTime now, Pageable pageable);

        // ========== Count queries for dashboard ==========

        long countByCreatedById(Long userId);

        long countByCreatedByIdAndStatus(Long userId, QuizStatus status);

        long countByStatus(QuizStatus status);

        // ========== Enhanced Search with Filters (listing — no @EntityGraph) ==========

        @Query("SELECT q FROM Quiz q WHERE q.status = 'PUBLISHED' AND " +
                        "(:difficulty IS NULL OR q.difficulty = :difficulty) AND " +
                        "(:tags IS NULL OR q.tags LIKE CONCAT('%', :tags, '%')) AND " +
                        "(q.startTime IS NULL OR q.startTime <= :now) AND " +
                        "(q.endTime IS NULL OR q.endTime >= :now)")
        Page<Quiz> findWithFilters(@Param("difficulty") String difficulty, @Param("tags") String tags,
                        @Param("now") LocalDateTime now, Pageable pageable);

        @Query("SELECT q FROM Quiz q WHERE q.status = 'PUBLISHED' AND " +
                        "q.category = :category AND " +
                        "(:difficulty IS NULL OR q.difficulty = :difficulty) AND " +
                        "(:tags IS NULL OR q.tags LIKE CONCAT('%', :tags, '%')) AND " +
                        "(q.startTime IS NULL OR q.startTime <= :now) AND " +
                        "(q.endTime IS NULL OR q.endTime >= :now)")
        Page<Quiz> findByCategoryWithFilters(@Param("category") String category, @Param("difficulty") String difficulty,
                        @Param("tags") String tags, @Param("now") LocalDateTime now, Pageable pageable);

        @Query("SELECT q FROM Quiz q WHERE q.status = 'PUBLISHED' AND " +
                        "LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%')) AND " +
                        "(:difficulty IS NULL OR q.difficulty = :difficulty) AND " +
                        "(:tags IS NULL OR q.tags LIKE CONCAT('%', :tags, '%')) AND " +
                        "(q.startTime IS NULL OR q.startTime <= :now) AND " +
                        "(q.endTime IS NULL OR q.endTime >= :now)")
        Page<Quiz> searchWithFilters(@Param("search") String search, @Param("difficulty") String difficulty,
                        @Param("tags") String tags, @Param("now") LocalDateTime now, Pageable pageable);

        // Get all unique categories from published quizzes
        @Query("SELECT DISTINCT q.category FROM Quiz q WHERE q.category IS NOT NULL AND q.status = 'PUBLISHED' ORDER BY q.category")
        List<String> findAllCategories();

        // Get all unique tags (only from published quizzes)
        @Query("SELECT DISTINCT q.tags FROM Quiz q WHERE q.tags IS NOT NULL AND q.status = 'PUBLISHED'")
        List<String> findAllTags();
}
