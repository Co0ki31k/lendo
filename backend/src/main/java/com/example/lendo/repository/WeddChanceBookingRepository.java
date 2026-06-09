package com.example.lendo.repository;

import com.example.lendo.model.WeddChanceBooking;
import com.example.lendo.model.WeddChanceBookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;

@Repository
public interface WeddChanceBookingRepository extends JpaRepository<WeddChanceBooking, Long> {
    boolean existsByCalendarIdAndStatusIn(Long calendarId, Collection<WeddChanceBookingStatus> statuses);
}
