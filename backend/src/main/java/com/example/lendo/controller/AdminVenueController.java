package com.example.lendo.controller;

import com.example.lendo.dto.AdminVenueResponse;
import com.example.lendo.dto.AdminVenueListResponse;
import com.example.lendo.dto.UpdateVenueStatusRequest;
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

@RestController
@RequestMapping("/api/admin/venues")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Venues", description = "Admin APIs for venue review")
public class AdminVenueController {
    private final AdminPartnerService adminPartnerService;

    @GetMapping
    @Operation(summary = "List all venues for admin review")
    public ResponseEntity<AdminVenueListResponse> getAllVenues(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        return ResponseEntity.ok(adminPartnerService.getAllVenues(page, size, search, status, sortBy, sortDir));
    }

    @PatchMapping("/{venueId}/status")
    @Operation(summary = "Update venue review status")
    public ResponseEntity<AdminVenueResponse> updateVenueStatus(
            @PathVariable Long venueId,
            @Valid @RequestBody UpdateVenueStatusRequest request
    ) {
        return ResponseEntity.ok(adminPartnerService.updateVenueStatus(venueId, request.status(), request.comment()));
    }

    @DeleteMapping("/{venueId}")
    @Operation(summary = "Delete venue from admin panel")
    public ResponseEntity<Void> deleteVenue(@PathVariable Long venueId) {
        adminPartnerService.deleteVenue(venueId);
        return ResponseEntity.noContent().build();
    }
}
