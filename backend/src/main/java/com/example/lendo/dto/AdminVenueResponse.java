package com.example.lendo.dto;

import java.math.BigDecimal;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminVenueResponse(
        Long id,
        UUID managerId,
        String managerEmail,
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
        String status,
        boolean verified,
        String adminReviewComment,
        LocalDateTime createdAt,
        VenueResponse.Address address
) {
    public static AdminVenueResponse from(Venue venue, VenueAddress address) {
        return new AdminVenueResponse(
                venue.getId(),
                venue.getManager().getId(),
                venue.getManager().getEmail(),
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
                venue.getStatus().name(),
                venue.isVerified(),
                venue.getAdminReviewComment(),
                venue.getCreatedAt(),
                new VenueResponse.Address(
                        address.getStreet(),
                        address.getCity(),
                        address.getPostalCode(),
                        address.getVoivodeship(),
                        address.getLatitude(),
                        address.getLongitude()
                )
        );
    }
}
