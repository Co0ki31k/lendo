package com.example.lendo.repository;

import com.example.lendo.model.VenueCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface VenueCalendarRepository extends JpaRepository<VenueCalendar, Long> {
    List<VenueCalendar> findByVenueIdAndEventDateBetweenOrderByEventDateAsc(Long venueId, LocalDate from, LocalDate to);

    List<VenueCalendar> findByVenueIdInAndEventDateBetween(Collection<Long> venueIds, LocalDate from, LocalDate to);

    Optional<VenueCalendar> findByVenueIdAndEventDate(Long venueId, LocalDate eventDate);
}
