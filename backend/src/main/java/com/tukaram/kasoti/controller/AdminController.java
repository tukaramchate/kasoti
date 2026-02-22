package com.tukaram.kasoti.controller;

import com.tukaram.kasoti.dto.DetailedAttemptDTO;
import com.tukaram.kasoti.dto.SystemStatsDTO;
import com.tukaram.kasoti.dto.UpdateRoleRequest;
import com.tukaram.kasoti.dto.UserAdminDTO;
import com.tukaram.kasoti.model.Quiz;
import com.tukaram.kasoti.model.Role;
import com.tukaram.kasoti.security.UserPrincipal;
import com.tukaram.kasoti.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Controller for admin-only operations.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin-only user & quiz management")
public class AdminController {

    private final AdminService adminService;

    // ========== User Management ==========

    @Operation(summary = "List all users", description = "Paginated list of all users in the system")
    @ApiResponse(responseCode = "200", description = "Page of users")
    @GetMapping("/users")
    public ResponseEntity<Page<UserAdminDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllUsers(page, size));
    }

    @Operation(summary = "List users by role", description = "Filter users by role (STUDENT, TEACHER, ADMIN)")
    @ApiResponse(responseCode = "200", description = "Page of users with specified role")
    @GetMapping("/users/role/{role}")
    public ResponseEntity<Page<UserAdminDTO>> getUsersByRole(
            @PathVariable Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getUsersByRole(role, page, size));
    }

    @Operation(summary = "Get user by ID", description = "Retrieve detailed info for a specific user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User found"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/users/{id}")
    public ResponseEntity<UserAdminDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @Operation(summary = "Update user role", description = "Change a user's role (STUDENT, TEACHER, ADMIN)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Role updated"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserAdminDTO> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(adminService.updateUserRole(id, request.getRole()));
    }

    @Operation(summary = "Delete user", description = "Permanently delete a user account. Cannot delete yourself.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "User deleted"),
            @ApiResponse(responseCode = "400", description = "Cannot delete yourself"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminService.deleteUser(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    // ========== Quiz Management ==========

    @Operation(summary = "List all quizzes", description = "Paginated list of all quizzes in the system")
    @ApiResponse(responseCode = "200", description = "Page of quizzes")
    @GetMapping("/quizzes")
    public ResponseEntity<Page<Quiz>> getAllQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllQuizzes(page, size));
    }

    @Operation(summary = "Delete any quiz", description = "Admin can delete any quiz regardless of creator")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Quiz deleted"),
            @ApiResponse(responseCode = "404", description = "Quiz not found")
    })
    @DeleteMapping("/quizzes/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long id) {
        adminService.deleteQuiz(id);
        return ResponseEntity.noContent().build();
    }

    // ========== System Statistics ==========

    @Operation(summary = "Get system statistics", description = "Returns counts of users, quizzes, attempts, and other system metrics")
    @ApiResponse(responseCode = "200", description = "System statistics")
    @GetMapping("/stats")
    public ResponseEntity<SystemStatsDTO> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    // ========== Attempt Management ==========

    @Operation(summary = "List all attempts", description = "Paginated list of all quiz attempts across the system")
    @ApiResponse(responseCode = "200", description = "Page of attempts")
    @GetMapping("/attempts")
    public ResponseEntity<Page<DetailedAttemptDTO>> getAllAttempts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllAttempts(page, size));
    }

    @Operation(summary = "Get attempt by ID", description = "Retrieve detailed info for a specific quiz attempt")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Attempt found"),
            @ApiResponse(responseCode = "404", description = "Attempt not found")
    })
    @GetMapping("/attempts/{id}")
    public ResponseEntity<DetailedAttemptDTO> getAttemptById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getAttemptById(id));
    }
}
