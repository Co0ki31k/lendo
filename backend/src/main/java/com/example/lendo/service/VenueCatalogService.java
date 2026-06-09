package com.example.lendo.service;

import com.example.lendo.dto.VenueCatalogDetailResponse;
import com.example.lendo.dto.VenueCatalogFilter;
import com.example.lendo.dto.VenueCatalogListItemResponse;
import com.example.lendo.dto.VenueImageResponse;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;
import com.example.lendo.model.VenueImage;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.repository.VenueAddressRepository;
import com.example.lendo.repository.VenueCatalogSpecifications;
import com.example.lendo.repository.VenueImageRepository;
import com.example.lendo.repository.VenueRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VenueCatalogService {
    private final VenueRepository venueRepository;
    private final VenueAddressRepository venueAddressRepository;
    private final VenueImageRepository venueImageRepository;

    @Transactional
    public Page<VenueCatalogListItemResponse> getApprovedVenues(VenueCatalogFilter filter, Pageable pageable) {
        Page<Venue> venuesPage = venueRepository.findAll(
                VenueCatalogSpecifications.approvedCatalogFilter(filter),
                pageable
        );

        List<Long> venueIds = venuesPage.getContent().stream()
                .map(Venue::getId)
                .toList();

        Map<Long, VenueAddress> addressesByVenueId = venueAddressRepository.findAllByVenueIdIn(venueIds).stream()
                .collect(Collectors.toMap(VenueAddress::getVenueId, Function.identity()));

        Map<Long, VenueImage> primaryImagesByVenueId = venueImageRepository.findByVenueIdInAndPrimaryImageTrue(venueIds).stream()
                .collect(Collectors.toMap(image -> image.getVenue().getId(), Function.identity()));

        return venuesPage.map(venue -> {
            VenueAddress address = addressesByVenueId.get(venue.getId());
            if (address == null) {
                throw new IllegalStateException("Venue address is missing for venue " + venue.getId());
            }

            return VenueCatalogListItemResponse.from(
                    venue,
                    address,
                    primaryImagesByVenueId.get(venue.getId())
            );
        });
    }

    @Transactional
    public VenueCatalogDetailResponse getApprovedVenueDetails(Long venueId) {
        Venue venue = venueRepository.findByIdAndStatus(venueId, VenueStatus.APPROVED)
                .filter(Venue::isVerified)
                .orElseThrow(() -> new RuntimeException("Obiekt nie istnieje"));

        VenueAddress address = venueAddressRepository.findById(venue.getId())
                .orElseThrow(() -> new IllegalStateException("Venue address is missing for venue " + venue.getId()));

        List<VenueImageResponse> images = venueImageRepository.findByVenueIdOrderByDisplayOrderAscIdAsc(venue.getId()).stream()
                .map(VenueImageResponse::from)
                .toList();

        return VenueCatalogDetailResponse.from(venue, address, images);
    }
}
