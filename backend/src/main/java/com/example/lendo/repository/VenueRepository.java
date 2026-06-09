package com.example.lendo.repository;

import com.example.lendo.model.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VenueRepository extends JpaRepository<Venue, Long> {
    List<Venue> findAllByManagerIdOrderByCreatedAtDesc(UUID managerId);
}
