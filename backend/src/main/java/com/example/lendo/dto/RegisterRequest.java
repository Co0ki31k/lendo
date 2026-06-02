package com.example.lendo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Email jest wymagany")
        @Email(message = "Email powinien być prawidłowy")
        String email,

        @NotBlank(message = "Hasło jest wymagane")
        @Size(min = 6, message = "Hasło powinno mieć co najmniej 6 znaków")
        String password,

        @NotBlank(message = "Imię jest wymagane")
        @Size(min = 2, max = 100, message = "Imię powinno mieć od 2 do 100 znaków")
        String firstName,

        @NotBlank(message = "Nazwisko jest wymagane")
        @Size(min = 2, max = 100, message = "Nazwisko powinno mieć od 2 do 100 znaków")
        String lastName,

        @Size(max = 20, message = "Telefon powinien mieć maksymalnie 20 znaków")
        String phoneNumber
) {}
