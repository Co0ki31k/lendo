package com.example.lendo.dto;

import com.example.lendo.model.UserFavorite;

import java.time.LocalDateTime;

public record UserFavoriteResponse(
        Long id,
        Long venueId,
        LocalDateTime addedAt
) {
    public static UserFavoriteResponse from(UserFavorite favorite) {
        return new UserFavoriteResponse(
                favorite.getId(),
                favorite.getVenue().getId(),
                favorite.getAddedAt()
        );
    }
}
