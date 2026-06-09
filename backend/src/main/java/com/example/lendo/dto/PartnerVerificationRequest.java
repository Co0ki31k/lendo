package com.example.lendo.dto;

import jakarta.validation.constraints.NotNull;

public record PartnerVerificationRequest(
        @NotNull(message = "Pole verified jest wymagane")
        Boolean verified
) {
}
