package com.example.lendo.controller;

import com.example.lendo.dto.PartnerStatsOverviewResponse;
import com.example.lendo.model.User;
import com.example.lendo.service.PartnerStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partner/stats")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@Tag(name = "Partner Stats", description = "Partner dashboard statistics APIs")
public class PartnerStatsController {
    private final PartnerStatsService partnerStatsService;

    @GetMapping("/overview")
    @Operation(summary = "Get current partner statistics overview")
    public ResponseEntity<PartnerStatsOverviewResponse> getOverview(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(partnerStatsService.getOverview(user));
    }
}
