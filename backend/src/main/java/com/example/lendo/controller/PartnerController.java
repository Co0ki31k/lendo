package com.example.lendo.controller;

import com.example.lendo.dto.PartnerProfileResponse;
import com.example.lendo.dto.PartnerProfileUpsertRequest;
import com.example.lendo.model.User;
import com.example.lendo.service.PartnerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partner/profile")
@RequiredArgsConstructor
@Tag(name = "Partner", description = "Partner onboarding and profile APIs")
public class PartnerController {
    private final PartnerService partnerService;

    @PutMapping
    @Operation(summary = "Create or update partner profile")
    public ResponseEntity<PartnerProfileResponse> upsertProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PartnerProfileUpsertRequest request
    ) {
        return ResponseEntity.ok(partnerService.upsertProfile(user, request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Get current partner profile")
    public ResponseEntity<PartnerProfileResponse> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(partnerService.getProfile(user));
    }
}
