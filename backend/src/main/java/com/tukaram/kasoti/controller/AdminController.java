package com.tukaram.kasoti.controller;

import com.tukaram.kasoti.dto.DetailedAttemptDTO;
import com.tukaram.kasoti.dto.SystemStatsDTO;
import com.tukaram.kasoti.dto.UpdateRoleRequest;
import com.tukaram.kasoti.dto.UserAdminDTO;
import com.tukaram.kasoti.model.Quiz;
import com.tukaram.kasoti.model.Role;
import com.tukaram.kasoti.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * Controller for admin-only operations.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ========== User Management ==========

    @GetMapping("/users")
    public ResponseEntity<Page<UserAdminDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllUsers(page, size));
    }

    @GetMapping("/users/role/{role}")
    public ResponseEntity<Page<UserAdminDTO>> getUsersByRole(
            @PathVariable Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getUsersByRole(role, page, size));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserAdminDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserAdminDTO> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(adminService.updateUserRole(id, request.getRole()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ========== Quiz Management ==========

    @GetMapping("/quizzes")
    public ResponseEntity<Page<Quiz>> getAllQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllQuizzes(page, size));
    }

    @DeleteMapping("/quizzes/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long id) {
        adminService.deleteQuiz(id);
        return ResponseEntity.noContent().build();
    }

    // ========== System Statistics ==========

    @GetMapping("/stats")
    public ResponseEntity<SystemStatsDTO> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    // ========== Attempt Management ==========

    @GetMapping("/attempts")
    public ResponseEntity<Page<DetailedAttemptDTO>> getAllAttempts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllAttempts(page, size));
    }

    @GetMapping("/attempts/{id}")
    public ResponseEntity<DetailedAttemptDTO> getAttemptById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getAttemptById(id));
    }
}
