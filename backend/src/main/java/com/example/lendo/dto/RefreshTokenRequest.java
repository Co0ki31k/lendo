package com.example.lendo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;


public record RefreshTokenRequest (

    @JsonProperty("refresh_token")
    @NotBlank(message = "Refresh token nie moze byc pusty")
    String refreshToken
){}

