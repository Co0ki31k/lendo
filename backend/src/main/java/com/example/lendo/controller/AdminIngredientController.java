package com.example.lendo.controller;

import com.example.lendo.dto.IngredientResponse;
import com.example.lendo.dto.IngredientUpsertRequest;
import com.example.lendo.service.AdminIngredientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/ingredients")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Ingredients", description = "Admin APIs for ingredient management")
public class AdminIngredientController {
    private final AdminIngredientService adminIngredientService;

    @GetMapping
    @Operation(summary = "List all ingredients")
    public ResponseEntity<List<IngredientResponse>> getIngredients() {
        return ResponseEntity.ok(adminIngredientService.getIngredients());
    }

    @GetMapping("/{ingredientId}")
    @Operation(summary = "Get ingredient details")
    public ResponseEntity<IngredientResponse> getIngredient(@PathVariable Long ingredientId) {
        return ResponseEntity.ok(adminIngredientService.getIngredient(ingredientId));
    }

    @PostMapping
    @Operation(summary = "Create ingredient")
    public ResponseEntity<IngredientResponse> createIngredient(@Valid @RequestBody IngredientUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminIngredientService.createIngredient(request));
    }

    @PutMapping("/{ingredientId}")
    @Operation(summary = "Update ingredient")
    public ResponseEntity<IngredientResponse> updateIngredient(
            @PathVariable Long ingredientId,
            @Valid @RequestBody IngredientUpsertRequest request
    ) {
        return ResponseEntity.ok(adminIngredientService.updateIngredient(ingredientId, request));
    }

    @DeleteMapping("/{ingredientId}")
    @Operation(summary = "Delete ingredient")
    public ResponseEntity<Void> deleteIngredient(@PathVariable Long ingredientId) {
        adminIngredientService.deleteIngredient(ingredientId);
        return ResponseEntity.noContent().build();
    }
}
