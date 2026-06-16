package com.example.lendo.dto;

import com.example.lendo.model.VenueInquiry;

import java.time.LocalDateTime;

public record VenueInquiryResponse(
        Long id,
        Long venueId,
        String venueName,
        String contactEmail,
        String contactPhone,
        String messageText,
        LocalDateTime createdAt
) {
    public static VenueInquiryResponse from(VenueInquiry inquiry) {
        return new VenueInquiryResponse(
                inquiry.getId(),
                inquiry.getVenue().getId(),
                inquiry.getVenue().getName(),
                inquiry.getContactEmail(),
                inquiry.getContactPhone(),
                inquiry.getMessageText(),
                inquiry.getCreatedAt()
        );
    }
}
