package com.example.lendo.controller;

import com.example.lendo.dto.SmartPlannerBookingDecisionRequest;
import com.example.lendo.dto.SmartPlannerBookingListFilter;
import com.example.lendo.dto.SmartPlannerBookingListResponse;
import com.example.lendo.dto.SmartPlannerBookingResponse;
import com.example.lendo.model.User;
import com.example.lendo.service.SmartPlannerBookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/partner/smart-planner/bookings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@Tag(name = "Partner Smart Planner Bookings", description = "Partner review APIs for smart planner bookings")
public class PartnerSmartPlannerBookingController {
    private final SmartPlannerBookingService smartPlannerBookingService;

    @GetMapping
    @Operation(summary = "List smart planner bookings for current partner")
    public ResponseEntity<SmartPlannerBookingListResponse> getManagerBookings(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate eventDateFrom,
            @RequestParam(required = false) LocalDate eventDateTo
    ) {
        return ResponseEntity.ok(smartPlannerBookingService.getManagerBookings(
                user,
                new SmartPlannerBookingListFilter(status, eventDateFrom, eventDateTo)
        ));
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Get smart planner booking details for current partner")
    public ResponseEntity<SmartPlannerBookingResponse> getBookingDetails(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId
    ) {
        return ResponseEntity.ok(smartPlannerBookingService.getBookingDetails(user, bookingId));
    }

    @PatchMapping("/{bookingId}/decision")
    @Operation(summary = "Approve or reject smart planner booking")
    public ResponseEntity<SmartPlannerBookingResponse> decideBooking(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId,
            @Valid @RequestBody SmartPlannerBookingDecisionRequest request
    ) {
        return ResponseEntity.ok(smartPlannerBookingService.decideBooking(user, bookingId, request));
    }

    @DeleteMapping("/{bookingId}")
    @Operation(summary = "Delete archived smart planner booking for current partner")
    public ResponseEntity<Void> deleteBooking(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId
    ) {
        smartPlannerBookingService.deleteManagerBooking(user, bookingId);
        return ResponseEntity.noContent().build();
    }
}
