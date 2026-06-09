package com.example.lendo.controller;

import com.example.lendo.dto.CreateVenueRequest;
import com.example.lendo.dto.VenueResponse;
import com.example.lendo.model.User;
import com.example.lendo.service.PartnerVenueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/partner/venues")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@Tag(name = "Partner Venues", description = "Partner venue management APIs")
public class PartnerVenueController {
    private final PartnerVenueService partnerVenueService;

    @PostMapping
    @Operation(summary = "Create a venue for current partner")
    public ResponseEntity<VenueResponse> createVenue(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateVenueRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(partnerVenueService.createVenue(user, request));
    }

    @GetMapping
    @Operation(summary = "List current partner venues")
    public ResponseEntity<List<VenueResponse>> getOwnVenues(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(partnerVenueService.getOwnVenues(user));
    }
}
