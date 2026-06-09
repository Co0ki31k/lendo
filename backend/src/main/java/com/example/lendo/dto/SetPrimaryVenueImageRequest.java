package com.example.lendo.dto;

import jakarta.validation.constraints.NotNull;

public record SetPrimaryVenueImageRequest(
        @NotNull(message = "Pole primaryImage jest wymagane")
        Boolean primaryImage
) {
}
