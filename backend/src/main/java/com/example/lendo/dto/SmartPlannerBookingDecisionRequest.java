package com.example.lendo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SmartPlannerBookingDecisionRequest(
        @NotBlank(message = "Decyzja jest wymagana")
        String decision,

        @Size(max = 4000, message = "Komentarz moze miec maksymalnie 4000 znakow")
        String comment
) {
}
