package com.example.lendo.dto;

import com.example.lendo.model.IngredientCategory;
import com.example.lendo.model.Recipe;
import com.example.lendo.model.UnitOfMeasure;

public record RecipeResponse(
        Long id,
        Long ingredientId,
        String ingredientName,
        IngredientCategory ingredientCategory,
        UnitOfMeasure unit,
        double wastePercentage,
        double quantityPerGuest
) {
    public static RecipeResponse from(Recipe recipe) {
        return new RecipeResponse(
                recipe.getId(),
                recipe.getIngredient().getId(),
                recipe.getIngredient().getName(),
                recipe.getIngredient().getCategory(),
                recipe.getIngredient().getDefaultUnit(),
                recipe.getIngredient().getWastePercentage(),
                recipe.getQuantityPerGuest()
        );
    }
}
