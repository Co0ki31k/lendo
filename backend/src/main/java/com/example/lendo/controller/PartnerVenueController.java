package com.example.lendo.controller;

import com.example.lendo.dto.CreateVenueRequest;
import com.example.lendo.dto.PartnerVenueListResponse;
import com.example.lendo.dto.SetPrimaryVenueImageRequest;
import com.example.lendo.dto.UpdateVenueRequest;
import com.example.lendo.dto.UpdateVenueImageOrderRequest;
import com.example.lendo.dto.VenueImageResponse;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

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

    @GetMapping("/{venueId}")
    @Operation(summary = "Get current partner venue details")
    public ResponseEntity<VenueResponse> getVenue(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId
    ) {
        return ResponseEntity.ok(partnerVenueService.getVenue(user, venueId));
    }

    @PutMapping("/{venueId}")
    @Operation(summary = "Update current partner venue")
    public ResponseEntity<VenueResponse> updateVenue(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId,
            @Valid @RequestBody UpdateVenueRequest request
    ) {
        return ResponseEntity.ok(partnerVenueService.updateVenue(user, venueId, request));
    }

    @DeleteMapping("/{venueId}")
    @Operation(summary = "Delete current partner venue")
    public ResponseEntity<Void> deleteVenue(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId
    ) {
        partnerVenueService.deleteVenue(user, venueId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{venueId}/submit")
    @Operation(summary = "Submit current partner venue for admin review")
    public ResponseEntity<VenueResponse> submitVenueForReview(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId
    ) {
        return ResponseEntity.ok(partnerVenueService.submitVenueForReview(user, venueId));
    }

    @PostMapping(path = "/{venueId}/images/upload", consumes = "multipart/form-data")
    @Operation(summary = "Upload image file to current partner venue")
    public ResponseEntity<VenueImageResponse> uploadVenueImage(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "displayOrder", required = false) Integer displayOrder,
            @RequestParam(value = "primaryImage", required = false) Boolean primaryImage
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(partnerVenueService.uploadVenueImage(user, venueId, file, displayOrder, primaryImage));
    }

    @GetMapping("/{venueId}/images")
    @Operation(summary = "List images for current partner venue")
    public ResponseEntity<List<VenueImageResponse>> getVenueImages(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId
    ) {
        return ResponseEntity.ok(partnerVenueService.getVenueImages(user, venueId));
    }

    @DeleteMapping("/{venueId}/images/{imageId}")
    @Operation(summary = "Delete image from current partner venue")
    public ResponseEntity<Void> deleteVenueImage(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId,
            @PathVariable Long imageId
    ) {
        partnerVenueService.deleteVenueImage(user, venueId, imageId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{venueId}/images/{imageId}/primary")
    @Operation(summary = "Set primary image for current partner venue")
    public ResponseEntity<VenueImageResponse> setPrimaryVenueImage(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId,
            @PathVariable Long imageId,
            @Valid @RequestBody SetPrimaryVenueImageRequest request
    ) {
        return ResponseEntity.ok(partnerVenueService.setPrimaryVenueImage(user, venueId, imageId, request));
    }

    @PatchMapping("/{venueId}/images/order")
    @Operation(summary = "Update image order for current partner venue")
    public ResponseEntity<List<VenueImageResponse>> updateVenueImageOrder(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId,
            @Valid @RequestBody UpdateVenueImageOrderRequest request
    ) {
        return ResponseEntity.ok(partnerVenueService.updateVenueImageOrder(user, venueId, request));
    }

    @GetMapping
    @Operation(summary = "List current partner venues")
    public ResponseEntity<PartnerVenueListResponse> getOwnVenues(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        return ResponseEntity.ok(partnerVenueService.getOwnVenues(user, page, size, search, status, sortBy, sortDir));
    }
}
