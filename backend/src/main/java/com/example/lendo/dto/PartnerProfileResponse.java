package com.example.lendo.dto;

import com.example.lendo.model.PartnerProfile;

import java.time.ZonedDateTime;
import java.util.UUID;

public record PartnerProfileResponse(
        UUID userId,
        String companyName,
        String taxId,
        String contactEmail,
        String description,
        boolean verified,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt
) {
    public static PartnerProfileResponse from(PartnerProfile profile) {
        return new PartnerProfileResponse(
                profile.getUserId(),
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
