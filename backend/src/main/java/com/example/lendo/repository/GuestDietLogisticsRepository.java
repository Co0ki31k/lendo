package com.example.lendo.repository;

import com.example.lendo.model.GuestDietLogistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface GuestDietLogisticsRepository extends JpaRepository<GuestDietLogistics, Long> {
    List<GuestDietLogistics> findAllByBookingIdIn(Collection<Long> bookingIds);

    @Modifying
    @Query("delete from GuestDietLogistics g where g.bookingId = :bookingId")
    void deleteByBookingId(@Param("bookingId") Long bookingId);
}
