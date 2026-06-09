package com.example.lendo.service;

import com.example.lendo.dto.CreateVenueRequest;
import com.example.lendo.dto.VenueResponse;
import com.example.lendo.model.User;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;
import com.example.lendo.repository.PartnerProfileRepository;
import com.example.lendo.repository.VenueAddressRepository;
import com.example.lendo.repository.VenueRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PartnerVenueService {
    private final VenueRepository venueRepository;
    private final VenueAddressRepository venueAddressRepository;
    private final PartnerProfileRepository partnerProfileRepository;

    @Transactional
    public VenueResponse createVenue(User user, CreateVenueRequest request) {
        requireVerifiedPartnerProfile(user);

        if (request.capacityMax() < request.capacityMin()) {
            throw new RuntimeException("Maksymalna pojemnosc nie moze byc mniejsza od minimalnej");
        }

        if (request.accommodationPlaces() < 0) {
            throw new RuntimeException("Liczba miejsc noclegowych nie moze byc ujemna");
        }

        if (!request.hasAccommodation() && request.accommodationPlaces() > 0) {
            throw new RuntimeException("Obiekt bez noclegu nie moze miec dodatniej liczby miejsc noclegowych");
        }

        Venue venue = venueRepository.save(
                Venue.builder()
                        .manager(user)
                        .name(request.name())
                        .description(request.description())
                        .style(request.style())
                        .capacityMin(request.capacityMin())
                        .capacityMax(request.capacityMax())
                        .hasAccommodation(request.hasAccommodation())
                        .accommodationPlaces(request.accommodationPlaces())
                        .basePricePerGuest(request.basePricePerGuest())
                        .noCorkageFee(request.noCorkageFee())
                        .civilWeddingGarden(request.civilWeddingGarden())
                        .verified(false)
                        .build()
        );

        VenueAddress address = venueAddressRepository.save(
                VenueAddress.builder()
                        .venue(venue)
                        .street(request.street())
                        .city(request.city())
                        .postalCode(request.postalCode())
                        .voivodeship(request.voivodeship())
                        .latitude(request.latitude())
                        .longitude(request.longitude())
                        .build()
        );

        return VenueResponse.from(venue, address);
    }

    @Transactional
    public List<VenueResponse> getOwnVenues(User user) {
        requirePartnerProfile(user);
        return venueRepository.findAllByManagerIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(venue -> VenueResponse.from(
                        venue,
                        venueAddressRepository.findById(venue.getId())
                                .orElseThrow(() -> new IllegalStateException("Venue address is missing for venue " + venue.getId()))
                ))
                .toList();
    }

    private void requirePartnerProfile(User user) {
        if (!partnerProfileRepository.existsById(user.getId())) {
            throw new RuntimeException("Najpierw uzupelnij profil partnera");
        }
    }

    private void requireVerifiedPartnerProfile(User user) {
        var profile = partnerProfileRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Najpierw uzupelnij profil partnera"));

        if (!profile.isVerified()) {
            throw new RuntimeException("Profil partnera czeka na zatwierdzenie przez administratora");
        }
    }
}
