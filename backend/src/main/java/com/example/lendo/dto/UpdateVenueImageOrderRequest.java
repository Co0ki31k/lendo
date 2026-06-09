package com.example.lendo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

public record UpdateVenueImageOrderRequest(
        @NotEmpty(message = "Lista kolejnosci zdjec jest wymagana")
        List<@Valid Item> items
) {
    public record Item(
            @NotNull(message = "Id zdjecia jest wymagane")
            Long imageId,

            @NotNull(message = "Display order jest wymagany")
            @PositiveOrZero(message = "Display order nie moze byc ujemny")
            Integer displayOrder
    ) {
    }
}
