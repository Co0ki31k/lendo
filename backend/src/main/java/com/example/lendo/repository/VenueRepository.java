package com.example.lendo.repository;

import com.example.lendo.model.Venue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VenueRepository extends JpaRepository<Venue, Long>, JpaSpecificationExecutor<Venue> {
    List<Venue> findAllByManagerIdOrderByCreatedAtDesc(UUID managerId);
    List<Venue> findAllByOrderByCreatedAtDesc();
    Optional<Venue> findByIdAndStatus(Long id, com.example.lendo.model.VenueStatus status);

    @Override
    @EntityGraph(attributePaths = {"manager", "address"})
    Page<Venue> findAll(Specification<Venue> spec, Pageable pageable);
}
