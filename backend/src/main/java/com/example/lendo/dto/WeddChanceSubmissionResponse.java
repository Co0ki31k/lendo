package com.example.lendo.dto;

import com.example.lendo.model.WeddChanceBooking;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record WeddChanceSubmissionResponse(
        Long bookingId,
        Long dealId,
        Long venueId,
        String venueName,
        LocalDate eventDate,
        Integer guestCount,
        BigDecimal specialPricePerGuest,
        BigDecimal totalEstimatedCost,
        LocalDateTime provisionalExpiresAt
) {
    public static WeddChanceSubmissionResponse from(WeddChanceBooking booking) {
        return new WeddChanceSubmissionResponse(
                booking.getId(),
                booking.getDeal().getId(),
                booking.getVenue().getId(),
                booking.getVenue().getName(),
                booking.getCalendar().getEventDate(),
                booking.getGuestCount(),
                booking.getSpecialPricePerGuest(),
                booking.getTotalEstimatedCost(),
                booking.getProvisionalExpiresAt()
        );
    }
}
