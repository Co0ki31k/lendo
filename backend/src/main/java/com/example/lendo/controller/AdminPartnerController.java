package com.example.lendo.controller;

import com.example.lendo.dto.AdminPartnerProfileResponse;
import com.example.lendo.dto.AdminPartnerListResponse;
import com.example.lendo.dto.PartnerVerificationRequest;
import com.example.lendo.service.AdminPartnerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/partners")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Partners", description = "Admin APIs for partner verification")
public class AdminPartnerController {
    private final AdminPartnerService adminPartnerService;

    @GetMapping
    @Operation(summary = "List all partner profiles")
    public ResponseEntity<AdminPartnerListResponse> getAllPartnerProfiles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        return ResponseEntity.ok(adminPartnerService.getAllPartnerProfiles(page, size, search, verified, sortBy, sortDir));
    }

    @PatchMapping("/{userId}/verification")
    @Operation(summary = "Update partner verification status")
    public ResponseEntity<AdminPartnerProfileResponse> setVerification(
            @PathVariable UUID userId,
            @Valid @RequestBody PartnerVerificationRequest request
    ) {
        return ResponseEntity.ok(adminPartnerService.setVerification(userId, request.verified()));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "Delete partner profile and reset account role")
    public ResponseEntity<Void> deletePartner(@PathVariable UUID userId) {
        adminPartnerService.deletePartner(userId);
        return ResponseEntity.noContent().build();
    }

}
