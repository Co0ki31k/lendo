package com.example.lendo.controller;

import com.example.lendo.dto.VenueCalendarResponse;
import com.example.lendo.dto.VenueCatalogDetailResponse;
import com.example.lendo.dto.VenueCatalogFilter;
import com.example.lendo.dto.VenueCatalogListItemResponse;
import com.example.lendo.service.VenueCalendarCatalogService;
import com.example.lendo.service.VenueCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/catalog/venues")
@RequiredArgsConstructor
@Tag(name = "Venue Catalog", description = "Public venue catalog APIs")
public class VenueCatalogController {
    private final VenueCatalogService venueCatalogService;
    private final VenueCalendarCatalogService venueCalendarCatalogService;

    @GetMapping
    @Operation(summary = "List approved venues with pagination and filters")
    public ResponseEntity<Page<VenueCatalogListItemResponse>> getApprovedVenues(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String voivodeship,
            @RequestParam(required = false) Integer guestCount,
            @RequestParam(required = false) BigDecimal minPricePerGuest,
            @RequestParam(required = false) BigDecimal maxPricePerGuest,
            @Parameter(description = "Pagination and sorting. Example: page=0&size=12&sort=basePricePerGuest,asc")
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        VenueCatalogFilter filter = new VenueCatalogFilter(
                search,
                city,
                voivodeship,
                guestCount,
                minPricePerGuest,
                maxPricePerGuest
        );

        return ResponseEntity.ok(venueCatalogService.getApprovedVenues(filter, pageable));
    }

    @GetMapping("/{venueId}")
    @Operation(summary = "Get approved venue details")
    public ResponseEntity<VenueCatalogDetailResponse> getApprovedVenueDetails(@PathVariable Long venueId) {
        return ResponseEntity.ok(venueCatalogService.getApprovedVenueDetails(venueId));
    }

    @GetMapping("/{venueId}/calendar")
    @Operation(summary = "Get approved venue availability calendar")
    public ResponseEntity<VenueCalendarResponse> getApprovedVenueCalendar(
            @PathVariable Long venueId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return ResponseEntity.ok(venueCalendarCatalogService.getApprovedVenueCalendar(venueId, from, to));
    }
}
