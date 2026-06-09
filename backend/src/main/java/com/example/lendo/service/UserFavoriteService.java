package com.example.lendo.service;

import com.example.lendo.dto.UserFavoriteResponse;
import com.example.lendo.model.User;
import com.example.lendo.model.UserFavorite;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.repository.UserFavoriteRepository;
import com.example.lendo.repository.VenueRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserFavoriteService {
    private final UserFavoriteRepository userFavoriteRepository;
    private final VenueRepository venueRepository;

    @Transactional
    public UserFavoriteResponse saveFavorite(User user, Long venueId) {
        UserFavorite existingFavorite = userFavoriteRepository.findByUserIdAndVenueId(user.getId(), venueId)
                .orElse(null);

        if (existingFavorite != null) {
            return UserFavoriteResponse.from(existingFavorite);
        }

        Venue venue = venueRepository.findByIdAndStatus(venueId, VenueStatus.APPROVED)
                .filter(Venue::isVerified)
                .orElseThrow(() -> new RuntimeException("Obiekt nie istnieje"));

        UserFavorite favorite = userFavoriteRepository.save(
                UserFavorite.builder()
                        .user(user)
                        .venue(venue)
                        .build()
        );

        return UserFavoriteResponse.from(favorite);
    }
}
