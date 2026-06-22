package com.example.lendo.dto;

import com.example.lendo.model.Dish;
import com.example.lendo.model.DishCategory;

public record DishSummaryResponse(
        Long id,
        String name,
        DishCategory category,
        Long venueId
) {
    public static DishSummaryResponse from(Dish dish) {
        return new DishSummaryResponse(
                dish.getId(),
                dish.getName(),
                dish.getCategory(),
                dish.getVenue() != null ? dish.getVenue().getId() : null
        );
    }
}
