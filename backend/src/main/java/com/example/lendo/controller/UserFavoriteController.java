package com.example.lendo.controller;

import com.example.lendo.dto.UserFavoriteResponse;
import com.example.lendo.model.User;
import com.example.lendo.service.UserFavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/favorites")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "User Favorites", description = "Authenticated user favorites APIs")
public class UserFavoriteController {
    private final UserFavoriteService userFavoriteService;

    @GetMapping
    @Operation(summary = "List current user favorite venues")
    public ResponseEntity<java.util.List<UserFavoriteResponse>> getFavorites(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userFavoriteService.getFavorites(user));
    }

    @PutMapping("/{venueId}")
    @Operation(summary = "Save approved venue to current user favorites")
    public ResponseEntity<UserFavoriteResponse> saveFavorite(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId
    ) {
        return ResponseEntity.ok(userFavoriteService.saveFavorite(user, venueId));
    }

    @DeleteMapping("/{venueId}")
    @Operation(summary = "Delete approved venue from current user favorites")
    public ResponseEntity<Void> deleteFavorite(
            @AuthenticationPrincipal User user,
            @PathVariable Long venueId
    ) {
        userFavoriteService.deleteFavorite(user, venueId);
        return ResponseEntity.noContent().build();
    }
}
