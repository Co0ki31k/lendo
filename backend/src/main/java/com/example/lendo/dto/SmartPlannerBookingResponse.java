package com.example.lendo.dto;

import com.example.lendo.model.Booking;
import com.example.lendo.model.GuestDietLogistics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record SmartPlannerBookingResponse(
        Long bookingId,
        String status,
        Long venueId,
        String venueName,
        String venueManagerId,
        String clientEmail,
        String clientFirstName,
        String clientLastName,
        LocalDate eventDate,
        Integer estimatedGuests,
        BigDecimal pricePerGuest,
        BigDecimal maxPricePerGuest,
        BigDecimal totalEstimatedCost,
        boolean fullService,
        String serviceNotes,
        String decisionComment,
        LocalDateTime decidedAt,
        LocalDateTime createdAt,
        DietLogistics dietLogistics
) {
    public static SmartPlannerBookingResponse from(Booking booking, GuestDietLogistics dietLogistics) {
        return new SmartPlannerBookingResponse(
                booking.getId(),
                booking.getStatus().name(),
                booking.getVenue().getId(),
                booking.getVenue().getName(),
                booking.getVenue().getManager().getId() != null ? booking.getVenue().getManager().getId().toString() : null,
                booking.getClient().getEmail(),
                booking.getClient().getFirstName(),
                booking.getClient().getLastName(),
                booking.getCalendar().getEventDate(),
                booking.getEstimatedGuests(),
                booking.getPricePerGuest(),
                booking.getMaxPricePerGuest(),
                booking.getTotalEstimatedCost(),
                booking.isFullService(),
                booking.getServiceNotes(),
                booking.getDecisionComment(),
                booking.getDecidedAt(),
                booking.getCreatedAt(),
                new DietLogistics(
                        dietLogistics.getMenuStandardCount(),
                        dietLogistics.getMenuVegetarianCount(),
                        dietLogistics.getMenuVeganCount(),
                        dietLogistics.getMenuGlutenFreeCount(),
                        dietLogistics.getAllergiesNotes()
                )
        );
    }

    public record DietLogistics(
            Integer menuStandardCount,
            Integer menuVegetarianCount,
            Integer menuVeganCount,
            Integer menuGlutenFreeCount,
            String allergiesNotes
    ) {
    }
}
