package com.example.lendo.repository;

import com.example.lendo.model.VenueStatus;
import com.example.lendo.model.WeddDeal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Repository
public interface WeddDealRepository extends JpaRepository<WeddDeal, Long> {

    @Query("""
            select wd
            from WeddDeal wd
            join wd.venue v
            join wd.calendar c
            join c.status s
            where wd.active = true
              and v.status = :approvedStatus
              and v.verified = true
              and c.eventDate >= :today
              and (
                    s.statusName = 'AVAILABLE'
                    or (s.statusName = 'PROVISIONAL' and c.provisionalExpiresAt is not null and c.provisionalExpiresAt < :now)
                  )
            """)
    Page<WeddDeal> findAvailableWeddDeals(
            @Param("today") LocalDate today,
            @Param("now") LocalDateTime now,
            @Param("approvedStatus") VenueStatus approvedStatus,
            Pageable pageable
    );

    @Query("""
            select count(wd)
            from WeddDeal wd
            join wd.venue v
            join wd.calendar c
            join c.status s
            where wd.active = true
              and v.status = :approvedStatus
              and v.verified = true
              and c.eventDate >= :today
              and (
                    s.statusName = 'AVAILABLE'
                    or (s.statusName = 'PROVISIONAL' and c.provisionalExpiresAt is not null and c.provisionalExpiresAt < :now)
                  )
            """)
    long countAvailableWeddDeals(
            @Param("today") LocalDate today,
            @Param("now") LocalDateTime now,
            @Param("approvedStatus") VenueStatus approvedStatus
    );

    @Query("""
            select avg(wd.discountPercentage)
            from WeddDeal wd
            join wd.venue v
            join wd.calendar c
            join c.status s
            where wd.active = true
              and v.status = :approvedStatus
              and v.verified = true
              and c.eventDate >= :today
              and (
                    s.statusName = 'AVAILABLE'
                    or (s.statusName = 'PROVISIONAL' and c.provisionalExpiresAt is not null and c.provisionalExpiresAt < :now)
                  )
            """)
    Double averageDiscountPercentageForAvailableWeddDeals(
            @Param("today") LocalDate today,
            @Param("now") LocalDateTime now,
            @Param("approvedStatus") VenueStatus approvedStatus
    );
}
