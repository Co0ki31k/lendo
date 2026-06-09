package com.example.lendo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateVenueStatusRequest(
        @NotBlank(message = "Status obiektu jest wymagany")
        @Size(max = 20, message = "Status obiektu jest za dlugi")
        String status
) {
}
