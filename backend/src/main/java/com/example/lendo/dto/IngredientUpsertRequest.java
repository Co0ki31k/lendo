package com.example.lendo.dto;

import com.example.lendo.model.IngredientCategory;
import com.example.lendo.model.UnitOfMeasure;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record IngredientUpsertRequest(
        @NotBlank @Size(max = 255) String name,
        @NotNull IngredientCategory category,
        @NotNull UnitOfMeasure defaultUnit,
        @DecimalMin("0.0") @DecimalMax(value = "0.999999", inclusive = true) double wastePercentage
) {
}
