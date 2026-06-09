package com.example.lendo.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record VenueCalendarDayResponse(
        LocalDate date,
        String status,
        LocalDateTime provisionalExpiresAt
) {
}
