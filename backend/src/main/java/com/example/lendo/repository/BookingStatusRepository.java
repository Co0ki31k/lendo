package com.example.lendo.repository;

import com.example.lendo.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingStatusRepository extends JpaRepository<BookingStatus, Integer> {
    Optional<BookingStatus> findByStatusName(String statusName);
}
