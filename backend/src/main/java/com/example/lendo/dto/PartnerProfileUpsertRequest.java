package com.example.lendo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PartnerProfileUpsertRequest(
        @NotBlank(message = "Nazwa firmy jest wymagana")
        @Size(max = 200, message = "Nazwa firmy moze miec maksymalnie 200 znakow")
        String companyName,

        @Size(max = 30, message = "NIP moze miec maksymalnie 30 znakow")
        String taxId,

        @Email(message = "Email kontaktowy powinien byc prawidlowy")
        @Size(max = 255, message = "Email kontaktowy moze miec maksymalnie 255 znakow")
        String contactEmail,

        @Size(max = 1000, message = "Opis moze miec maksymalnie 1000 znakow")
        String description
) {
}
