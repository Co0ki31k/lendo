package com.example.lendo.dto;

import java.time.LocalDate;

public record SmartPlannerBookingListFilter(
        String status,
        LocalDate eventDateFrom,
        LocalDate eventDateTo
) {
}
