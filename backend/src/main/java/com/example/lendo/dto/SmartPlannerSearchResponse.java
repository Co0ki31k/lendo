package com.example.lendo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record SmartPlannerSearchResponse(
        List<Offer> offers,
        PageMetadata page,
        Summary summary
) {
    public record Summary(
            long totalOffers,
            long matchedOffers
    ) {
    }

    public record Offer(
            Long id,
            String name,
            String description,
            String style,
            BigDecimal basePricePerGuest,
            boolean hasAccommodation,
            Integer accommodationPlaces,
            Integer capacityMin,
            Integer capacityMax,
            String city,
            String voivodeship,
            String primaryImageUrl,
            Integer availableDatesCount,
            List<LocalDate> availableDatesPreview
    ) {
    }
}
