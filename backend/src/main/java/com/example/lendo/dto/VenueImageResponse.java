package com.example.lendo.dto;

import com.example.lendo.model.VenueImage;

import java.time.LocalDateTime;

public record VenueImageResponse(
        Long id,
        Long venueId,
        String imageUrl,
        String cloudinaryPublicId,
        Integer displayOrder,
        boolean primaryImage,
        LocalDateTime createdAt
) {
    public static VenueImageResponse from(VenueImage image) {
        return new VenueImageResponse(
                image.getId(),
                image.getVenue().getId(),
                image.getImageUrl(),
                image.getCloudinaryPublicId(),
                image.getDisplayOrder(),
                image.isPrimaryImage(),
                image.getCreatedAt()
        );
    }
}
