package com.example.lendo.dto;

import com.example.lendo.model.User;

import java.time.ZonedDateTime;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        String role,
        boolean active,
        ZonedDateTime createdAt
) {
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhoneNumber(),
                user.getRoleName(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
