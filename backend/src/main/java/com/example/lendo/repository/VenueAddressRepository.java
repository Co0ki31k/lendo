package com.example.lendo.repository;

import com.example.lendo.model.VenueAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface VenueAddressRepository extends JpaRepository<VenueAddress, Long> {
    List<VenueAddress> findAllByVenueIdIn(Collection<Long> venueIds);
}
