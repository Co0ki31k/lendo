package com.example.lendo.dto;

import com.example.lendo.model.Ingredient;
import com.example.lendo.model.IngredientCategory;
import com.example.lendo.model.UnitOfMeasure;

public record IngredientResponse(
        Long id,
        String name,
        IngredientCategory category,
        UnitOfMeasure defaultUnit,
        double wastePercentage
) {
    public static IngredientResponse from(Ingredient ingredient) {
        return new IngredientResponse(
                ingredient.getId(),
                ingredient.getName(),
                ingredient.getCategory(),
                ingredient.getDefaultUnit(),
                ingredient.getWastePercentage()
        );
    }
}
