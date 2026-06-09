package com.example.lendo.dto;

import com.example.lendo.model.UserFavorite;

import java.time.LocalDateTime;

public record UserFavoriteResponse(
        Long id,
        Long venueId,
        String venueName,
        String city,
        String primaryImageUrl,
        LocalDateTime addedAt
) {
    public static UserFavoriteResponse from(UserFavorite favorite, String city, String primaryImageUrl) {
        return new UserFavoriteResponse(
                favorite.getId(),
                favorite.getVenue().getId(),
                favorite.getVenue().getName(),
                city,
                primaryImageUrl,
                favorite.getAddedAt()
        );
    }
}
