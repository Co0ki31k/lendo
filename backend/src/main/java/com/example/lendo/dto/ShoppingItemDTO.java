package com.example.lendo.dto;

import com.example.lendo.model.IngredientCategory;
import com.example.lendo.model.UnitOfMeasure;

public record ShoppingItemDTO(
        String ingredientName,
        IngredientCategory category,
        double totalQuantity,
        UnitOfMeasure unit
) {
}
