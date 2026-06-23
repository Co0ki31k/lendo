package com.example.lendo.repository;

import com.example.lendo.model.UserFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {
    Optional<UserFavorite> findByUserIdAndVenueId(UUID userId, Long venueId);
    List<UserFavorite> findAllByUserIdOrderByAddedAtDesc(UUID userId);
    List<UserFavorite> findAllByUserIdAndVenueIdIn(UUID userId, Set<Long> venueIds);
    List<UserFavorite> findAllByVenueIdIn(Collection<Long> venueIds);
    void deleteByUserIdAndVenueId(UUID userId, Long venueId);
}
