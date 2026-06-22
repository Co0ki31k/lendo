package com.example.lendo.controller;

import com.example.lendo.dto.ShoppingItemDTO;
import com.example.lendo.model.User;
import com.example.lendo.service.WeddingMenuShoppingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
    private final WeddingMenuShoppingService weddingMenuShoppingService;

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
