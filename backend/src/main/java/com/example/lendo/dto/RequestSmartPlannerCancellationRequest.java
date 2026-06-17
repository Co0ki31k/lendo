package com.example.lendo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RequestSmartPlannerCancellationRequest(
        @NotBlank(message = "Powod anulacji jest wymagany")
        @Size(max = 4000, message = "Powod anulacji moze miec maksymalnie 4000 znakow")
        String reason
) {
}
