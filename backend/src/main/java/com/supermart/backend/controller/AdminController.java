package com.supermart.backend.controller;

import com.supermart.backend.dto.AdminStatsDto;
import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.dto.CreateStaffUserRequest;
import com.supermart.backend.dto.UserManagementDto;
import com.supermart.backend.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminUserService adminUserService;

    public AdminController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserManagementDto>>> getAllUsers() {
        List<UserManagementDto> users = adminUserService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("System users retrieved successfully.", users));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserManagementDto>> createUser(@Valid @RequestBody CreateStaffUserRequest request) {
        UserManagementDto created = adminUserService.createUser(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User successfully added to the system.", created));
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, String> payload) {

        String status = payload.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Status field is required."));
        }

        adminUserService.updateUserStatus(userId, status);
        return ResponseEntity.ok(ApiResponse.success("User status updated to " + status, null));
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> payload) {

        String roleName = payload.get("roleName");
        if (roleName == null || roleName.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("RoleName field is required."));
        }

        adminUserService.updateUserRole(userId, roleName);
        return ResponseEntity.ok(ApiResponse.success("User role updated to " + roleName, null));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsDto>> getAdminStats() {
        AdminStatsDto stats = adminUserService.getAdminStats();
        return ResponseEntity.ok(ApiResponse.success("Executive admin statistics retrieved.", stats));
    }
}
