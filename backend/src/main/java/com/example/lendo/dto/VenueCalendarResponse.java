package com.example.lendo.dto;

import java.time.LocalDate;
import java.util.List;

public record VenueCalendarResponse(
        Long venueId,
        LocalDate from,
        LocalDate to,
        List<VenueCalendarDayResponse> days
) {
}
