package com.example.lendo.dto;

import com.example.lendo.model.MenuType;
import com.example.lendo.model.WeddingMenu;

import java.util.Comparator;
import java.util.List;

public record WeddingMenuResponse(
        Long id,
        Long venueId,
        MenuType menuType,
        List<DishSummaryResponse> dishes
) {
    public static WeddingMenuResponse from(WeddingMenu weddingMenu) {
        return new WeddingMenuResponse(
                weddingMenu.getId(),
                weddingMenu.getVenue().getId(),
                weddingMenu.getMenuType(),
                weddingMenu.getDishes().stream()
                        .sorted(Comparator.comparing((com.example.lendo.model.Dish dish) -> dish.getCategory().name())
                                .thenComparing(com.example.lendo.model.Dish::getName, String.CASE_INSENSITIVE_ORDER))
                        .map(DishSummaryResponse::from)
                        .toList()
        );
    }
}
