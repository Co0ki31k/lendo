package com.example.lendo.dto;

import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VenueResponse(
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
        boolean verified,
        LocalDateTime createdAt,
        Address address
) {
    public static VenueResponse from(Venue venue, VenueAddress address) {
        return new VenueResponse(
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
                venue.isVerified(),
                venue.getCreatedAt(),
                new Address(
                        address.getStreet(),
                        address.getCity(),
                        address.getPostalCode(),
                        address.getVoivodeship(),
                        address.getLatitude(),
                        address.getLongitude()
                )
        );
    }

    public record Address(
            String street,
            String city,
            String postalCode,
            String voivodeship,
            BigDecimal latitude,
            BigDecimal longitude
    ) {
    }
}
