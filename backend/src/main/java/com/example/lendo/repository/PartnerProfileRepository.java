package com.example.lendo.repository;

import com.example.lendo.model.PartnerProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PartnerProfileRepository extends JpaRepository<PartnerProfile, UUID>, JpaSpecificationExecutor<PartnerProfile> {
    List<PartnerProfile> findAllByOrderByCreatedAtDesc();

    @Override
    @EntityGraph(attributePaths = "user")
    Page<PartnerProfile> findAll(Specification<PartnerProfile> spec, Pageable pageable);
}
