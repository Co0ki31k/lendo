package com.example.lendo.dto;

import com.example.lendo.model.PartnerProfile;

import java.time.ZonedDateTime;
import java.util.UUID;

public record AdminPartnerProfileResponse(
        UUID userId,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        String companyName,
        String taxId,
        String contactEmail,
        String description,
        boolean verified,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt
) {
    public static AdminPartnerProfileResponse from(PartnerProfile profile) {
        return new AdminPartnerProfileResponse(
                profile.getUserId(),
                profile.getUser().getEmail(),
                profile.getUser().getFirstName(),
                profile.getUser().getLastName(),
                profile.getUser().getPhoneNumber(),
                profile.getCompanyName(),
                profile.getTaxId(),
                profile.getContactEmail(),
                profile.getDescription(),
                profile.isVerified(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
