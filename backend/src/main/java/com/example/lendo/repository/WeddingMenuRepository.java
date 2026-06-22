package com.example.lendo.repository;

import com.example.lendo.model.WeddingMenu;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WeddingMenuRepository extends JpaRepository<WeddingMenu, Long> {
    @Override
    @EntityGraph(attributePaths = {"booking", "booking.venue", "booking.venue.manager"})
    Optional<WeddingMenu> findById(Long id);
}
