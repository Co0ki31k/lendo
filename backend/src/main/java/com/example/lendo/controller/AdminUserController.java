package com.example.lendo.controller;

import com.example.lendo.dto.AdminUserListResponse;
import com.example.lendo.dto.AdminUserResponse;
import com.example.lendo.dto.UpdateUserRoleRequest;
import com.example.lendo.model.User;
import com.example.lendo.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Users", description = "Admin APIs for managing user and admin accounts")
public class AdminUserController {
    private final AdminUserService adminUserService;

    @GetMapping
    @Operation(summary = "List user and admin accounts")
    public ResponseEntity<AdminUserListResponse> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "all") String role,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        return ResponseEntity.ok(adminUserService.getUsers(page, size, search, role, sortBy, sortDir));
    }

    @PatchMapping("/{userId}/role")
    @Operation(summary = "Update user role between CLIENT and ADMIN")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal User currentAdmin
    ) {
        return ResponseEntity.ok(adminUserService.updateUserRole(userId, request.role(), currentAdmin.getId()));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "Delete user or admin account")
    public ResponseEntity<Void> deleteUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal User currentAdmin
    ) {
        adminUserService.deleteUser(userId, currentAdmin.getId());
        return ResponseEntity.noContent().build();
    }
}
