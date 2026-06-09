package com.example.lendo.dto;

import com.example.lendo.model.VenueAddress;
import com.example.lendo.model.VenueImage;
import com.example.lendo.model.WeddDeal;

import java.math.BigDecimal;
import java.time.LocalDate;

public record WeddChanceOfferResponse(
        Long dealId,
        Long venueId,
        String venueName,
        String city,
        String voivodeship,
        String primaryImageUrl,
        LocalDate eventDate,
        Integer originalGuestCount,
        boolean allowGuestCountAdjustment,
        Integer minGuestCount,
        Integer maxGuestCount,
        BigDecimal originalPricePerGuest,
        BigDecimal specialPricePerGuest,
        Integer discountPercentage,
        String description
) {
    public static WeddChanceOfferResponse from(
            WeddDeal deal,
            VenueAddress address,
            VenueImage primaryImage
    ) {
        return new WeddChanceOfferResponse(
                deal.getId(),
                deal.getVenue().getId(),
                deal.getVenue().getName(),
                address != null ? address.getCity() : null,
                address != null ? address.getVoivodeship() : null,
                primaryImage != null ? primaryImage.getImageUrl() : null,
                deal.getCalendar().getEventDate(),
                deal.getOriginalGuestCount(),
                deal.isAllowGuestCountAdjustment(),
                deal.getMinGuestCount(),
                deal.getMaxGuestCount(),
                deal.getVenue().getBasePricePerGuest(),
                deal.getSpecialPricePerGuest(),
                deal.getDiscountPercentage(),
                deal.getDescription()
        );
    }
}
