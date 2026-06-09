package com.example.lendo.dto;

public record VenueImageUploadResult(
        String imageUrl,
        String cloudinaryPublicId
) {
}
