package com.example.lendo.dto;

import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminVenueResponse(
        Long id,
        UUID managerId,
        String managerEmail,
        String name,
        String status,
        boolean verified,
        LocalDateTime createdAt,
        VenueResponse.Address address
) {
    public static AdminVenueResponse from(Venue venue, VenueAddress address) {
        return new AdminVenueResponse(
                venue.getId(),
                venue.getManager().getId(),
                venue.getManager().getEmail(),
                venue.getName(),
                venue.getStatus().name(),
                venue.isVerified(),
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
