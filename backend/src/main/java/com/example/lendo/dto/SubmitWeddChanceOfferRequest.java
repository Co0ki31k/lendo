package com.example.lendo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record SubmitWeddChanceOfferRequest(
        @NotNull(message = "Liczba gosci jest wymagana")
        @Positive(message = "Liczba gosci musi byc dodatnia")
        Integer guestCount,

        @Size(max = 2000, message = "Wiadomosc moze miec maksymalnie 2000 znakow")
        String message
) {
}
