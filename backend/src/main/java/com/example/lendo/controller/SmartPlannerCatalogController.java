package com.example.lendo.controller;

import com.example.lendo.dto.SmartPlannerSearchRequest;
import com.example.lendo.dto.SmartPlannerSearchResponse;
import com.example.lendo.service.SmartPlannerCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalog/smart-planner")
@RequiredArgsConstructor
@Tag(name = "Smart Planner Catalog", description = "Smart planner venue discovery APIs")
public class SmartPlannerCatalogController {
    private final SmartPlannerCatalogService smartPlannerCatalogService;

    @PostMapping("/offers/search")
    @Operation(summary = "Search smart planner offers with summary counters")
    public ResponseEntity<SmartPlannerSearchResponse> searchOffers(
            @Valid @RequestBody SmartPlannerSearchRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(smartPlannerCatalogService.searchOffers(request, page, size));
    }
}
