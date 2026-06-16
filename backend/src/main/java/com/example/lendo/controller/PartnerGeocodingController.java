package com.example.lendo.controller;

import com.example.lendo.dto.GeocodeAddressRequest;
import com.example.lendo.dto.GeocodeAddressResponse;
import com.example.lendo.service.GeocodingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partner/geocoding")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@Tag(name = "Partner Geocoding", description = "Partner geocoding APIs")
public class PartnerGeocodingController {
    private final GeocodingService geocodingService;

    @PostMapping("/address")
    @Operation(summary = "Resolve coordinates from partner venue address")
    public ResponseEntity<GeocodeAddressResponse> geocodeAddress(
            @Valid @RequestBody GeocodeAddressRequest request
    ) {
        return ResponseEntity.ok(geocodingService.geocodeAddress(request));
    }
}
