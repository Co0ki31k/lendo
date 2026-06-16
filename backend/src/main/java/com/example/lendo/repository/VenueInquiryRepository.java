package com.example.lendo.repository;

import com.example.lendo.model.VenueInquiry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VenueInquiryRepository extends JpaRepository<VenueInquiry, Long> {
    List<VenueInquiry> findAllByVenueIdOrderByCreatedAtDesc(Long venueId);
}
