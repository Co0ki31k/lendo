package com.example.lendo.repository;

import com.example.lendo.model.VenueImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VenueImageRepository extends JpaRepository<VenueImage, Long> {
    List<VenueImage> findByVenueIdOrderByDisplayOrderAscIdAsc(Long venueId);
}
