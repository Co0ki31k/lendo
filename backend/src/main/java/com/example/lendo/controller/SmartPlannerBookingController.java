package com.example.lendo.controller;

import com.example.lendo.dto.CreateSmartPlannerBookingRequest;
import com.example.lendo.dto.RequestSmartPlannerCancellationRequest;
import com.example.lendo.dto.SmartPlannerBookingListFilter;
import com.example.lendo.dto.SmartPlannerBookingListResponse;
import com.example.lendo.dto.SmartPlannerBookingResponse;
import com.example.lendo.dto.UpdateSmartPlannerBookingRequest;
import com.example.lendo.model.User;
import com.example.lendo.service.SmartPlannerBookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/smart-planner/bookings")
@RequiredArgsConstructor
@Tag(name = "Smart Planner Bookings", description = "Client smart planner booking APIs")
public class SmartPlannerBookingController {
    private final SmartPlannerBookingService smartPlannerBookingService;

    @PostMapping
    @Operation(summary = "Create smart planner booking submission")
    public ResponseEntity<SmartPlannerBookingResponse> createBooking(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateSmartPlannerBookingRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(smartPlannerBookingService.createBooking(user, request));
    }

    @GetMapping("/me")
    @Operation(summary = "List current user smart planner bookings")
    public ResponseEntity<SmartPlannerBookingListResponse> getMyBookings(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate eventDateFrom,
            @RequestParam(required = false) LocalDate eventDateTo
    ) {
        return ResponseEntity.ok(smartPlannerBookingService.getClientBookings(
                user,
                new SmartPlannerBookingListFilter(status, eventDateFrom, eventDateTo)
        ));
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Get smart planner booking details for current user")
    public ResponseEntity<SmartPlannerBookingResponse> getBookingDetails(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId
    ) {
        return ResponseEntity.ok(smartPlannerBookingService.getBookingDetails(user, bookingId));
    }

    @PutMapping("/{bookingId}")
    @Operation(summary = "Request update of approved smart planner booking")
    public ResponseEntity<SmartPlannerBookingResponse> updateApprovedBooking(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId,
            @Valid @RequestBody UpdateSmartPlannerBookingRequest request
    ) {
        return ResponseEntity.ok(smartPlannerBookingService.requestBookingUpdate(user, bookingId, request));
    }

    @PatchMapping("/{bookingId}/cancel-request")
    @Operation(summary = "Request cancellation of approved smart planner booking")
    public ResponseEntity<SmartPlannerBookingResponse> requestCancellation(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId,
            @Valid @RequestBody RequestSmartPlannerCancellationRequest request
    ) {
        return ResponseEntity.ok(smartPlannerBookingService.requestBookingCancellation(user, bookingId, request));
    }
}
