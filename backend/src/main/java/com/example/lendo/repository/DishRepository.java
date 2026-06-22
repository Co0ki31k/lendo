package com.example.lendo.repository;

import com.example.lendo.model.Dish;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DishRepository extends JpaRepository<Dish, Long> {
    @Override
    @EntityGraph(attributePaths = {"venue", "venue.manager"})
    Optional<Dish> findById(Long id);

    @EntityGraph(attributePaths = {"venue", "venue.manager"})
    List<Dish> findAllByVenueIdOrderByNameAsc(Long venueId);

    @Query("""
            select distinct dish from Dish dish
            left join fetch dish.venue venue
            left join fetch venue.manager
            where dish.id in :ids and venue.id = :venueId
            """)
    List<Dish> findAllByIdInAndVenueId(@Param("ids") Collection<Long> ids, @Param("venueId") Long venueId);

    @EntityGraph(attributePaths = {"venue", "venue.manager"})
    List<Dish> findAllByIdIn(Collection<Long> ids);
}
