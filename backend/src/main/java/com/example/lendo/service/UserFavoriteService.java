package com.example.lendo.service;

import com.example.lendo.dto.UserFavoriteResponse;
import com.example.lendo.model.User;
import com.example.lendo.model.UserFavorite;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;
import com.example.lendo.model.VenueImage;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.repository.UserFavoriteRepository;
import com.example.lendo.repository.VenueAddressRepository;
import com.example.lendo.repository.VenueImageRepository;
import com.example.lendo.repository.VenueRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserFavoriteService {
    private final UserFavoriteRepository userFavoriteRepository;
    private final VenueRepository venueRepository;
    private final VenueAddressRepository venueAddressRepository;
    private final VenueImageRepository venueImageRepository;

    @Transactional
    public UserFavoriteResponse saveFavorite(User user, Long venueId) {
        UserFavorite existingFavorite = userFavoriteRepository.findByUserIdAndVenueId(user.getId(), venueId)
                .orElse(null);

        if (existingFavorite != null) {
            return mapFavorite(existingFavorite);
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

        return mapFavorite(favorite);
    }

    @Transactional
    public List<UserFavoriteResponse> getFavorites(User user) {
        return userFavoriteRepository.findAllByUserIdOrderByAddedAtDesc(user.getId()).stream()
                .map(this::mapFavorite)
                .toList();
    }

    @Transactional
    public void deleteFavorite(User user, Long venueId) {
        userFavoriteRepository.deleteByUserIdAndVenueId(user.getId(), venueId);
    }

    @Transactional
    public Set<Long> getFavoriteVenueIds(User user, Set<Long> venueIds) {
        if (user == null || venueIds.isEmpty()) {
            return Set.of();
        }

        return userFavoriteRepository.findAllByUserIdAndVenueIdIn(user.getId(), venueIds).stream()
                .map(favorite -> favorite.getVenue().getId())
                .collect(Collectors.toSet());
    }

    @Transactional
    public boolean isFavorite(User user, Long venueId) {
        if (user == null) {
            return false;
        }
        return userFavoriteRepository.findByUserIdAndVenueId(user.getId(), venueId).isPresent();
    }

    private UserFavoriteResponse mapFavorite(UserFavorite favorite) {
        Long venueId = favorite.getVenue().getId();
        VenueAddress address = venueAddressRepository.findById(venueId)
                .orElse(null);
        VenueImage primaryImage = venueImageRepository.findByVenueIdOrderByDisplayOrderAscIdAsc(venueId).stream()
                .filter(VenueImage::isPrimaryImage)
                .findFirst()
                .orElse(null);

        return UserFavoriteResponse.from(
                favorite,
                address != null ? address.getCity() : null,
                address != null ? address.getVoivodeship() : null,
                primaryImage != null ? primaryImage.getImageUrl() : null
        );
    }
}
