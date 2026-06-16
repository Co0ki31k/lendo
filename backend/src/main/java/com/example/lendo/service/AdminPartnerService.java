package com.example.lendo.service;

import com.example.lendo.dto.AdminVenueResponse;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.dto.AdminPartnerProfileResponse;
import com.example.lendo.repository.VenueAddressRepository;
import com.example.lendo.repository.VenueRepository;
import com.example.lendo.model.PartnerProfile;
import com.example.lendo.repository.PartnerProfileRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminPartnerService {
    private final PartnerProfileRepository partnerProfileRepository;
    private final VenueRepository venueRepository;
    private final VenueAddressRepository venueAddressRepository;

    @Transactional
    public List<AdminPartnerProfileResponse> getAllPartnerProfiles() {
        return partnerProfileRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AdminPartnerProfileResponse::from)
                .toList();
    }

    @Transactional
    public AdminPartnerProfileResponse setVerification(UUID userId, boolean verified) {
        PartnerProfile profile = partnerProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Profil partnera nie istnieje"));

        profile.setVerified(verified);
        return AdminPartnerProfileResponse.from(partnerProfileRepository.save(profile));
    }

    @Transactional
    public List<AdminVenueResponse> getAllVenues() {
        return venueRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toAdminVenueResponse)
                .toList();
    }

    @Transactional
    public AdminVenueResponse updateVenueStatus(Long venueId, String rawStatus, String comment) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new RuntimeException("Obiekt nie istnieje"));

        VenueStatus status;
        try {
            status = VenueStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Nieobslugiwany status obiektu");
        }

        venue.setStatus(status);
        venue.setVerified(status == VenueStatus.APPROVED);

        if (status == VenueStatus.DRAFT) {
            if (!StringUtils.hasText(comment)) {
                throw new RuntimeException("Dodaj komentarz dla managera przed cofnieciem obiektu do poprawy");
            }

            venue.setAdminReviewComment(comment.trim());
        } else if (status == VenueStatus.APPROVED) {
            venue.setAdminReviewComment(null);
        } else if (StringUtils.hasText(comment)) {
            venue.setAdminReviewComment(comment.trim());
        } else {
            venue.setAdminReviewComment(null);
        }

        return toAdminVenueResponse(venue);
    }

    private AdminVenueResponse toAdminVenueResponse(Venue venue) {
        VenueAddress address = venueAddressRepository.findById(venue.getId())
                .orElseThrow(() -> new IllegalStateException("Venue address is missing for venue " + venue.getId()));
        return AdminVenueResponse.from(venue, address);
    }
}
