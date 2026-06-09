package com.example.lendo.dto;

import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;
import com.example.lendo.model.VenueImage;

import java.math.BigDecimal;

public record VenueCatalogListItemResponse(
        Long id,
        String name,
        String description,
        String style,
        Integer capacityMin,
        Integer capacityMax,
        boolean hasAccommodation,
        Integer accommodationPlaces,
        BigDecimal basePricePerGuest,
        boolean noCorkageFee,
        boolean civilWeddingGarden,
        String city,
        String voivodeship,
        String primaryImageUrl
) {
    public static VenueCatalogListItemResponse from(Venue venue, VenueAddress address, VenueImage primaryImage) {
        return new VenueCatalogListItemResponse(
                venue.getId(),
                venue.getName(),
                venue.getDescription(),
                venue.getStyle(),
                venue.getCapacityMin(),
                venue.getCapacityMax(),
                venue.isHasAccommodation(),
                venue.getAccommodationPlaces(),
                venue.getBasePricePerGuest(),
                venue.isNoCorkageFee(),
                venue.isCivilWeddingGarden(),
                address.getCity(),
                address.getVoivodeship(),
                primaryImage != null ? primaryImage.getImageUrl() : null
        );
    }
}
