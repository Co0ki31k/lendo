package com.example.lendo.repository;

import com.example.lendo.model.Booking;
import com.example.lendo.model.BookingRequestStatus;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {
    boolean existsByCalendarIdAndStatusIn(Long calendarId, Collection<BookingRequestStatus> statuses);

    List<Booking> findAllByCalendarIdAndStatusIn(Long calendarId, Collection<BookingRequestStatus> statuses);

    @EntityGraph(attributePaths = {"client", "venue", "venue.manager", "calendar"})
    List<Booking> findAllByVenueManagerIdOrderByCreatedAtDesc(UUID managerId);

    @EntityGraph(attributePaths = {"client", "venue", "venue.manager", "calendar"})
    List<Booking> findAllByClientIdOrderByCreatedAtDesc(UUID clientId);

    @EntityGraph(attributePaths = {"client", "venue", "venue.manager", "calendar"})
    List<Booking> findAllByOrderByCreatedAtDesc();

    @Override
    @EntityGraph(attributePaths = {"client", "venue", "venue.manager", "calendar"})
    Optional<Booking> findById(Long id);

    @Override
    @EntityGraph(attributePaths = {"client", "venue", "venue.manager", "calendar"})
    List<Booking> findAll(org.springframework.data.jpa.domain.Specification<Booking> spec);
}
