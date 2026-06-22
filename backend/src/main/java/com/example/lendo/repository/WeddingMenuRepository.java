package com.example.lendo.repository;

import com.example.lendo.model.MenuType;
import com.example.lendo.model.WeddingMenu;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeddingMenuRepository extends JpaRepository<WeddingMenu, Long> {
    @Override
    @EntityGraph(attributePaths = {"venue", "venue.manager", "dishes", "dishes.venue", "dishes.venue.manager"})
    List<WeddingMenu> findAll();

    @Override
    @EntityGraph(attributePaths = {"venue", "venue.manager", "dishes", "dishes.venue", "dishes.venue.manager"})
    Optional<WeddingMenu> findById(Long id);

    @EntityGraph(attributePaths = {"venue", "venue.manager", "dishes", "dishes.venue", "dishes.venue.manager"})
    Optional<WeddingMenu> findByVenueIdAndMenuType(Long venueId, MenuType menuType);

    @EntityGraph(attributePaths = {"venue", "venue.manager", "dishes", "dishes.venue", "dishes.venue.manager"})
    List<WeddingMenu> findAllByVenueManagerIdOrderByVenueIdAscMenuTypeAsc(UUID managerId);

    @EntityGraph(attributePaths = {"venue", "venue.manager", "dishes", "dishes.venue", "dishes.venue.manager"})
    List<WeddingMenu> findAllByVenueIdOrderByMenuTypeAsc(Long venueId);
}
