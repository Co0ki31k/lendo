package com.example.lendo.dto;

import jakarta.validation.constraints.NotBlank;

public record GeocodeAddressRequest(
        @NotBlank(message = "Ulica jest wymagana")
        String street,
        @NotBlank(message = "Miasto jest wymagane")
        String city,
        @NotBlank(message = "Kod pocztowy jest wymagany")
        String postalCode,
        @NotBlank(message = "Wojewodztwo jest wymagane")
        String voivodeship
) {
}
