package com.example.lendo.dto;

import com.example.lendo.model.User;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record AuthResponse(
        @JsonProperty("access_token")
        String accessToken,

        @JsonProperty("refresh_token")
        String refreshToken,

        Long expiresIn,

        @JsonProperty("token_type")
        String tokenType,

        UserInfo user
){
    public static AuthResponse of(User user, String accessToken, String refreshToken, long expiresIn, String tokenType){
        return new AuthResponse(
                accessToken,
                refreshToken,
                expiresIn,
                tokenType,
                new UserInfo(
                        user.getId(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getPhoneNumber(),
                        user.getRoleName(),
                        user.isActive()
                )
        );
    }

    public record UserInfo(
            UUID id,
            String email,
            String firstName,
            String lastName,
            String phoneNumber,
            String role,
            Boolean isActive
    ) {}
}