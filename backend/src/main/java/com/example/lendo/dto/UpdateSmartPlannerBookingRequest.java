package com.example.lendo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateSmartPlannerBookingRequest(
        @NotNull(message = "Maksymalna cena za osobe jest wymagana")
        @DecimalMin(value = "0.00", message = "Maksymalna cena za osobe nie moze byc ujemna")
        BigDecimal maxPricePerGuest,

        @NotNull(message = "Informacja o full service jest wymagana")
        Boolean fullService,

        @NotNull(message = "Szacowana liczba gosci jest wymagana")
        @Positive(message = "Szacowana liczba gosci musi byc dodatnia")
        Integer estimatedGuests,

        @NotNull(message = "Liczba menu standard jest wymagana")
        @Min(value = 0, message = "Liczba menu standard nie moze byc ujemna")
        Integer menuStandardCount,

        @NotNull(message = "Liczba menu vegetarian jest wymagana")
        @Min(value = 0, message = "Liczba menu vegetarian nie moze byc ujemna")
        Integer menuVegetarianCount,

        @NotNull(message = "Liczba menu vegan jest wymagana")
        @Min(value = 0, message = "Liczba menu vegan nie moze byc ujemna")
        Integer menuVeganCount,

        @NotNull(message = "Liczba menu gluten free jest wymagana")
        @Min(value = 0, message = "Liczba menu gluten free nie moze byc ujemna")
        Integer menuGlutenFreeCount,

        @Size(max = 4000, message = "Uwagi o alergiach moga miec maksymalnie 4000 znakow")
        String allergiesNotes,

        @Size(max = 4000, message = "Uwagi do obslugi moga miec maksymalnie 4000 znakow")
        String serviceNotes,

        @Size(max = 4000, message = "Uzasadnienie zmiany moze miec maksymalnie 4000 znakow")
        String requestNotes
) {
}
