package com.example.lendo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SmartPlannerSearchRequest(
        @NotNull(message = "Maksymalna cena za osobe jest wymagana")
        @DecimalMin(value = "0.00", message = "Maksymalna cena za osobe nie moze byc ujemna")
        BigDecimal maxPricePerGuest,

        @Size(max = 50, message = "Styl moze miec maksymalnie 50 znakow")
        String style,

        Boolean hasAccommodation,

        @Size(max = 50, message = "Wojewodztwo moze miec maksymalnie 50 znakow")
        String voivodeship,

        @NotNull(message = "Rok jest wymagany")
        @Min(value = 2024, message = "Rok jest nieprawidlowy")
        @Max(value = 2100, message = "Rok jest nieprawidlowy")
        Integer year,

        @NotNull(message = "Miesiac jest wymagany")
        @Min(value = 1, message = "Miesiac musi byc z zakresu 1-12")
        @Max(value = 12, message = "Miesiac musi byc z zakresu 1-12")
        Integer month,

        @Positive(message = "Szacowana liczba gosci musi byc dodatnia")
        Integer estimatedGuests
) {
}
