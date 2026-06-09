package com.example.lendo.repository;

import com.example.lendo.model.VenueAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VenueAddressRepository extends JpaRepository<VenueAddress, Long> {
}
