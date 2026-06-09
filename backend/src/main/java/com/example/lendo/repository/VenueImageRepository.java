package com.example.lendo.repository;

import com.example.lendo.model.VenueImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface VenueImageRepository extends JpaRepository<VenueImage, Long> {
    List<VenueImage> findByVenueIdOrderByDisplayOrderAscIdAsc(Long venueId);
    List<VenueImage> findByVenueIdInAndPrimaryImageTrue(Collection<Long> venueIds);
    Optional<VenueImage> findByIdAndVenueId(Long id, Long venueId);
}
