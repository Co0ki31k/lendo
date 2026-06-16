package com.example.lendo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateVenueInquiryRequest(
        @NotBlank(message = "Email kontaktowy jest wymagany")
        @Email(message = "Email kontaktowy powinien byc prawidlowy")
        @Size(max = 255, message = "Email kontaktowy moze miec maksymalnie 255 znakow")
        String contactEmail,

        @Size(max = 30, message = "Numer telefonu moze miec maksymalnie 30 znakow")
        String contactPhone,

        @NotBlank(message = "Tresc wiadomosci jest wymagana")
        @Size(max = 4000, message = "Tresc wiadomosci moze miec maksymalnie 4000 znakow")
        String messageText
) {
}
