package com.example.lendo.dto;

import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VenueCatalogDetailResponse(
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
        boolean favorite,
        LocalDateTime createdAt,
        Address address,
        List<Image> images
) {
    public static VenueCatalogDetailResponse from(
            Venue venue,
            VenueAddress address,
            List<VenueImageResponse> images,
            boolean favorite
    ) {
        return new VenueCatalogDetailResponse(
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
                favorite,
                venue.getCreatedAt(),
                new Address(
                        address.getStreet(),
                        address.getCity(),
                        address.getPostalCode(),
                        address.getVoivodeship(),
                        address.getLatitude(),
                        address.getLongitude()
                ),
                images.stream()
                        .map(image -> new Image(
                                image.id(),
                                image.imageUrl(),
                                image.displayOrder(),
                                image.primaryImage()
                        ))
                        .toList()
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

    public record Image(
            Long id,
            String imageUrl,
            Integer displayOrder,
            boolean primaryImage
    ) {
    }
}
