package com.example.lendo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateVenueRequest(
        @NotBlank(message = "Nazwa obiektu jest wymagana")
        @Size(max = 150, message = "Nazwa obiektu moze miec maksymalnie 150 znakow")
        String name,

        @Size(max = 50000, message = "Opis moze miec maksymalnie 50000 znakow")
        String description,

        @NotBlank(message = "Styl obiektu jest wymagany")
        @Size(max = 50, message = "Styl obiektu moze miec maksymalnie 50 znakow")
        String style,

        @NotNull(message = "Minimalna pojemnosc jest wymagana")
        @Positive(message = "Minimalna pojemnosc musi byc dodatnia")
        Integer capacityMin,

        @NotNull(message = "Maksymalna pojemnosc jest wymagana")
        @Positive(message = "Maksymalna pojemnosc musi byc dodatnia")
        Integer capacityMax,

        @NotNull(message = "Pole hasAccommodation jest wymagane")
        Boolean hasAccommodation,

        @NotNull(message = "Liczba miejsc noclegowych jest wymagana")
        Integer accommodationPlaces,

        @NotNull(message = "Cena bazowa za goscia jest wymagana")
        @DecimalMin(value = "0.00", message = "Cena bazowa nie moze byc ujemna")
        BigDecimal basePricePerGuest,

        @NotNull(message = "Pole noCorkageFee jest wymagane")
        Boolean noCorkageFee,

        @NotNull(message = "Pole civilWeddingGarden jest wymagane")
        Boolean civilWeddingGarden,

        @NotBlank(message = "Ulica jest wymagana")
        @Size(max = 150, message = "Ulica moze miec maksymalnie 150 znakow")
        String street,

        @NotBlank(message = "Miasto jest wymagane")
        @Size(max = 100, message = "Miasto moze miec maksymalnie 100 znakow")
        String city,

        @NotBlank(message = "Kod pocztowy jest wymagany")
        @Size(max = 20, message = "Kod pocztowy moze miec maksymalnie 20 znakow")
        String postalCode,

        @NotBlank(message = "Wojewodztwo jest wymagane")
        @Size(max = 50, message = "Wojewodztwo moze miec maksymalnie 50 znakow")
        String voivodeship
) {
}
