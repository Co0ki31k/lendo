package com.example.lendo.dto;

import com.example.lendo.model.DishCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DishUpsertRequest(
        @NotBlank @Size(max = 255) String name,
        @NotNull DishCategory category
) {
}
