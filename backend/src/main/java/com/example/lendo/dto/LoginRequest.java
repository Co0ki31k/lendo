package com.example.lendo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Email jest wymagany")
        @Email(message = "Email powinien być prawidłowy")
        String email,

        @NotBlank(message = "Hasło jest wymagane")
        @Size(min = 6, message = "Hasło powinno mieć co najmniej 6 znaków")
        String password
) {}

