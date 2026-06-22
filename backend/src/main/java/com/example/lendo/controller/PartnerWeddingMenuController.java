package com.example.lendo.controller;

import com.example.lendo.dto.DishSummaryResponse;
import com.example.lendo.dto.DishUpsertRequest;
import com.example.lendo.dto.IngredientResponse;
import com.example.lendo.dto.RecipeResponse;
import com.example.lendo.dto.RecipeUpsertRequest;
import com.example.lendo.dto.ShoppingItemDTO;
import com.example.lendo.dto.UpdateWeddingMenuRequest;
import com.example.lendo.dto.WeddingMenuResponse;
import com.example.lendo.model.User;
import com.example.lendo.service.PartnerWeddingMenuManagementService;
import com.example.lendo.service.WeddingMenuShoppingService;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/partner/wedding-menus")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@Tag(name = "Partner Wedding Menus", description = "Partner APIs for wedding menu shopping lists")
public class PartnerWeddingMenuController {
    private final PartnerWeddingMenuManagementService partnerWeddingMenuManagementService;
    private final WeddingMenuShoppingService weddingMenuShoppingService;

    @GetMapping
    @Operation(summary = "List wedding menus for current partner")
    public ResponseEntity<List<WeddingMenuResponse>> getWeddingMenus(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Long venueId
    ) {
        return ResponseEntity.ok(partnerWeddingMenuManagementService.getWeddingMenus(user, venueId));
    }

    @GetMapping("/dishes")
    @Operation(summary = "List dishes for selected managed venue")
    public ResponseEntity<List<DishSummaryResponse>> getVenueDishes(
            @AuthenticationPrincipal User user,
            @RequestParam Long venueId
    ) {
        return ResponseEntity.ok(partnerWeddingMenuManagementService.getVenueDishes(user, venueId));
    }

    @GetMapping("/ingredients")
    @Operation(summary = "List global ingredient catalog available for menu recipes")
    public ResponseEntity<List<IngredientResponse>> getAvailableIngredients(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(partnerWeddingMenuManagementService.getAvailableIngredients(user));
    }

    @PostMapping("/venues/{venueId}/defaults")
    @Operation(summary = "Ensure four default menu templates exist for managed venue")
    public ResponseEntity<Void> ensureDefaultMenus(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId
    ) {
        partnerWeddingMenuManagementService.ensureDefaultMenus(user, venueId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{weddingMenuId}")
    @Operation(summary = "Get wedding menu details for current partner")
    public ResponseEntity<WeddingMenuResponse> getWeddingMenu(
            @AuthenticationPrincipal User user,
            @PathVariable Long weddingMenuId
    ) {
        return ResponseEntity.ok(partnerWeddingMenuManagementService.getWeddingMenu(user, weddingMenuId));
    }

    @PutMapping("/{weddingMenuId}")
    @Operation(summary = "Update dishes assigned to wedding menu")
    public ResponseEntity<WeddingMenuResponse> updateWeddingMenu(
            @AuthenticationPrincipal User user,
            @PathVariable Long weddingMenuId,
            @Valid @RequestBody UpdateWeddingMenuRequest request
    ) {
        return ResponseEntity.ok(partnerWeddingMenuManagementService.updateWeddingMenu(user, weddingMenuId, request));
    }

    @PostMapping("/{weddingMenuId}/dishes")
    @Operation(summary = "Create new partner dish and assign it to wedding menu")
    public ResponseEntity<DishSummaryResponse> createDish(
            @AuthenticationPrincipal User user,
            @PathVariable Long weddingMenuId,
            @Valid @RequestBody DishUpsertRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(partnerWeddingMenuManagementService.createDish(user, weddingMenuId, request));
    }

    @PutMapping("/{weddingMenuId}/dishes/{dishId}")
    @Operation(summary = "Update owned dish assigned to wedding menu")
    public ResponseEntity<DishSummaryResponse> updateDish(
            @AuthenticationPrincipal User user,
            @PathVariable Long weddingMenuId,
            @PathVariable Long dishId,
            @Valid @RequestBody DishUpsertRequest request
    ) {
        return ResponseEntity.ok(partnerWeddingMenuManagementService.updateDish(user, weddingMenuId, dishId, request));
    }

    @DeleteMapping("/{weddingMenuId}/dishes/{dishId}")
    @Operation(summary = "Remove owned dish from wedding menu")
    public ResponseEntity<Void> deleteDish(
            @AuthenticationPrincipal User user,
            @PathVariable Long weddingMenuId,
            @PathVariable Long dishId
    ) {
        partnerWeddingMenuManagementService.deleteDish(user, weddingMenuId, dishId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{weddingMenuId}/dishes/{dishId}/recipes")
    @Operation(summary = "List recipes for dish assigned to wedding menu")
    public ResponseEntity<List<RecipeResponse>> getDishRecipes(
            @AuthenticationPrincipal User user,
            @PathVariable Long weddingMenuId,
            @PathVariable Long dishId
    ) {
        return ResponseEntity.ok(partnerWeddingMenuManagementService.getDishRecipes(user, weddingMenuId, dishId));
    }

    @PostMapping("/{weddingMenuId}/dishes/{dishId}/recipes")
    @Operation(summary = "Create recipe item for dish assigned to wedding menu")
    public ResponseEntity<RecipeResponse> createRecipe(
            @AuthenticationPrincipal User user,
            @PathVariable Long weddingMenuId,
            @PathVariable Long dishId,
            @Valid @RequestBody RecipeUpsertRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(partnerWeddingMenuManagementService.createRecipe(user, weddingMenuId, dishId, request));
    }

    @PutMapping("/{weddingMenuId}/dishes/{dishId}/recipes/{recipeId}")
    @Operation(summary = "Update recipe item for dish assigned to wedding menu")
    public ResponseEntity<RecipeResponse> updateRecipe(
            @AuthenticationPrincipal User user,
            @PathVariable Long weddingMenuId,
            @PathVariable Long dishId,
            @PathVariable Long recipeId,
            @Valid @RequestBody RecipeUpsertRequest request
    ) {
        return ResponseEntity.ok(partnerWeddingMenuManagementService.updateRecipe(user, weddingMenuId, dishId, recipeId, request));
    }

    @DeleteMapping("/{weddingMenuId}/dishes/{dishId}/recipes/{recipeId}")
    @Operation(summary = "Delete recipe item for dish assigned to wedding menu")
    public ResponseEntity<Void> deleteRecipe(
            @AuthenticationPrincipal User user,
            @PathVariable Long weddingMenuId,
            @PathVariable Long dishId,
            @PathVariable Long recipeId
    ) {
        partnerWeddingMenuManagementService.deleteRecipe(user, weddingMenuId, dishId, recipeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{weddingMenuId}/shopping-list")
    @Operation(summary = "Generate shopping list for selected wedding menu")
    public ResponseEntity<List<ShoppingItemDTO>> getShoppingList(
            @AuthenticationPrincipal User user,
            @PathVariable Long weddingMenuId,
            @RequestParam int guestCount
    ) {
        return ResponseEntity.ok(weddingMenuShoppingService.generateShoppingList(user, weddingMenuId, guestCount));
    }
}
