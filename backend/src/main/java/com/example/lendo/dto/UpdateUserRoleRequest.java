package com.example.lendo.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateUserRoleRequest(
        @NotBlank(message = "Rola jest wymagana")
        String role
) {
}
