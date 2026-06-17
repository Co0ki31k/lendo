package com.example.lendo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SmartPlannerBookingDecisionRequest(
        @NotBlank(message = "Decyzja jest wymagana")
        String decision,

        @Size(max = 4000, message = "Komentarz moze miec maksymalnie 4000 znakow")
        String comment,

        @Min(value = 1, message = "Rabat musi byc dodatni")
        @Max(value = 100, message = "Rabat nie moze byc wiekszy niz 100")
        Integer discountPercentage,

        @DecimalMin(value = "0.00", message = "Cena specjalna nie moze byc ujemna")
        BigDecimal specialPricePerGuest,

        Boolean allowGuestCountAdjustment,

        @Min(value = 1, message = "Minimalna liczba gosci musi byc dodatnia")
        Integer minGuestCount,

        @Min(value = 1, message = "Maksymalna liczba gosci musi byc dodatnia")
        Integer maxGuestCount,

        @Size(max = 4000, message = "Opis oferty moze miec maksymalnie 4000 znakow")
        String dealDescription
) {
}
