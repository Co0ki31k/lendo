package com.example.lendo.controller;

import com.example.lendo.dto.SubmitWeddChanceOfferRequest;
import com.example.lendo.dto.WeddChanceSubmissionResponse;
import com.example.lendo.dto.WeddChanceResponse;
import com.example.lendo.model.User;
import com.example.lendo.service.WeddChanceService;
import com.example.lendo.service.WeddChanceSubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weddchance/offers")
@RequiredArgsConstructor
@Tag(name = "WeddChance", description = "Public special wedding deals APIs")
public class WeddChanceController {
    private final WeddChanceService weddChanceService;
    private final WeddChanceSubmissionService weddChanceSubmissionService;

    @GetMapping
    @Operation(summary = "List available WeddChance offers with summary")
    public ResponseEntity<WeddChanceResponse> getAvailableOffers(
            @Parameter(description = "Pagination and sorting. Example: page=0&size=12&sort=calendar.eventDate,asc")
            @PageableDefault(size = 12, sort = "calendar.eventDate", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(weddChanceService.getAvailableOffers(pageable));
    }

    @PostMapping("/{dealId}/submit")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Submit WeddChance offer to venue manager")
    public ResponseEntity<WeddChanceSubmissionResponse> submitOffer(
            @AuthenticationPrincipal User user,
            @PathVariable Long dealId,
            @Valid @RequestBody SubmitWeddChanceOfferRequest request
    ) {
        return ResponseEntity.ok(weddChanceSubmissionService.submitOffer(user, dealId, request));
    }
}
