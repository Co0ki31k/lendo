package com.example.lendo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RecipeUpsertRequest(
        @NotNull Long ingredientId,
        @Positive double quantityPerGuest
) {
}
