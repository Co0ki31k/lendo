package com.example.lendo.service;

import com.example.lendo.dto.PageMetadata;
import com.example.lendo.dto.SmartPlannerSearchRequest;
import com.example.lendo.dto.SmartPlannerSearchResponse;
import com.example.lendo.model.BookingStatus;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;
import com.example.lendo.model.VenueCalendar;
import com.example.lendo.model.VenueImage;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.repository.VenueAddressRepository;
import com.example.lendo.repository.VenueCalendarRepository;
import com.example.lendo.repository.VenueImageRepository;
import com.example.lendo.repository.VenueRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SmartPlannerCatalogService {
    private static final int MAX_PAGE_SIZE = 50;
    private static final String PROVISIONAL = "PROVISIONAL";
    private static final String CONFIRMED = "CONFIRMED";

    private final VenueRepository venueRepository;
    private final VenueAddressRepository venueAddressRepository;
    private final VenueImageRepository venueImageRepository;
    private final VenueCalendarRepository venueCalendarRepository;

    @Transactional
    public SmartPlannerSearchResponse searchOffers(SmartPlannerSearchRequest request, int page, int size) {
        YearMonth yearMonth = YearMonth.of(request.year(), request.month());
        LocalDate from = yearMonth.atDay(1);
        LocalDate to = yearMonth.atEndOfMonth();

        List<Venue> approvedVenues = venueRepository.findAll(approvedAndVerified());
        List<Long> venueIds = approvedVenues.stream()
                .map(Venue::getId)
                .toList();

        Map<Long, VenueAddress> addressesByVenueId = venueAddressRepository.findAllByVenueIdIn(venueIds).stream()
                .collect(Collectors.toMap(VenueAddress::getVenueId, Function.identity()));
        Map<Long, VenueImage> primaryImagesByVenueId = venueImageRepository.findByVenueIdInAndPrimaryImageTrue(venueIds).stream()
                .collect(Collectors.toMap(image -> image.getVenue().getId(), Function.identity()));
        Map<Long, List<VenueCalendar>> calendarEntriesByVenueId = venueCalendarRepository
                .findByVenueIdInAndEventDateBetween(venueIds, from, to)
                .stream()
                .collect(Collectors.groupingBy(entry -> entry.getVenue().getId()));

        List<CandidateOffer> totalCandidates = new ArrayList<>();
        List<CandidateOffer> matchedCandidates = new ArrayList<>();

        for (Venue venue : approvedVenues) {
            VenueAddress address = addressesByVenueId.get(venue.getId());
            if (address == null) {
                continue;
            }

            Availability availability = resolveAvailability(
                    from,
                    to,
                    calendarEntriesByVenueId.getOrDefault(venue.getId(), List.of())
            );
            if (availability.availableDatesCount() <= 0) {
                continue;
            }

            CandidateOffer candidate = new CandidateOffer(
                    venue,
                    address,
                    primaryImagesByVenueId.get(venue.getId()),
                    availability
            );
            totalCandidates.add(candidate);

            if (matchesFilters(candidate, request)) {
                matchedCandidates.add(candidate);
            }
        }

        matchedCandidates.sort(Comparator
                .comparing((CandidateOffer offer) -> offer.venue().getBasePricePerGuest())
                .thenComparing(offer -> offer.venue().getName(), String.CASE_INSENSITIVE_ORDER));

        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        int fromIndex = Math.min(normalizedPage * normalizedSize, matchedCandidates.size());
        int toIndex = Math.min(fromIndex + normalizedSize, matchedCandidates.size());

        List<SmartPlannerSearchResponse.Offer> offers = matchedCandidates.subList(fromIndex, toIndex).stream()
                .map(this::toOfferResponse)
                .toList();

        int totalPages = matchedCandidates.isEmpty() ? 0 : (int) Math.ceil((double) matchedCandidates.size() / normalizedSize);

        return new SmartPlannerSearchResponse(
                offers,
                new PageMetadata(
                        normalizedPage,
                        normalizedSize,
                        matchedCandidates.size(),
                        totalPages,
                        toIndex < matchedCandidates.size(),
                        normalizedPage > 0 && !matchedCandidates.isEmpty()
                ),
                new SmartPlannerSearchResponse.Summary(
                        totalCandidates.size(),
                        matchedCandidates.size()
                )
        );
    }

    private Specification<Venue> approvedAndVerified() {
        return (root, query, cb) -> cb.and(
                cb.equal(root.get("status"), VenueStatus.APPROVED),
                cb.isTrue(root.get("verified"))
        );
    }

    private boolean matchesFilters(CandidateOffer candidate, SmartPlannerSearchRequest request) {
        Venue venue = candidate.venue();
        VenueAddress address = candidate.address();

        if (venue.getBasePricePerGuest().compareTo(request.maxPricePerGuest()) > 0) {
            return false;
        }

        if (request.estimatedGuests() != null) {
            if (venue.getCapacityMin() > request.estimatedGuests() || venue.getCapacityMax() < request.estimatedGuests()) {
                return false;
            }
        }

        if (request.hasAccommodation() != null && venue.isHasAccommodation() != request.hasAccommodation()) {
            return false;
        }

        if (StringUtils.hasText(request.style())
                && !venue.getStyle().trim().equalsIgnoreCase(request.style().trim())) {
            return false;
        }

        return !StringUtils.hasText(request.voivodeship())
                || address.getVoivodeship().trim().equalsIgnoreCase(request.voivodeship().trim());
    }

    private Availability resolveAvailability(LocalDate from, LocalDate to, Collection<VenueCalendar> entries) {
        Map<LocalDate, VenueCalendar> entriesByDate = entries.stream()
                .collect(Collectors.toMap(VenueCalendar::getEventDate, Function.identity(), (left, right) -> left, HashMap::new));
        List<LocalDate> availableDatesPreview = new ArrayList<>();
        int availableDatesCount = 0;

        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            VenueCalendar entry = entriesByDate.get(date);
            if (entry == null || !isBlocked(entry)) {
                availableDatesCount++;
                if (availableDatesPreview.size() < 5) {
                    availableDatesPreview.add(date);
                }
            }
        }

        return new Availability(availableDatesCount, availableDatesPreview);
    }

    private boolean isBlocked(VenueCalendar entry) {
        BookingStatus status = entry.getStatus();
        if (status == null || status.getStatusName() == null) {
            return false;
        }

        if (CONFIRMED.equals(status.getStatusName())) {
            return true;
        }

        if (PROVISIONAL.equals(status.getStatusName())) {
            return entry.getProvisionalExpiresAt() == null || entry.getProvisionalExpiresAt().isAfter(LocalDateTime.now());
        }

        return false;
    }

    private SmartPlannerSearchResponse.Offer toOfferResponse(CandidateOffer offer) {
        Venue venue = offer.venue();
        VenueAddress address = offer.address();
        VenueImage primaryImage = offer.primaryImage();

        return new SmartPlannerSearchResponse.Offer(
                venue.getId(),
                venue.getName(),
                venue.getDescription(),
                venue.getStyle(),
                venue.getBasePricePerGuest(),
                venue.isHasAccommodation(),
                venue.getAccommodationPlaces(),
                venue.getCapacityMin(),
                venue.getCapacityMax(),
                address.getCity(),
                address.getVoivodeship(),
                primaryImage != null ? primaryImage.getImageUrl() : null,
                offer.availability().availableDatesCount(),
                offer.availability().availableDatesPreview()
        );
    }

    private record Availability(
            int availableDatesCount,
            List<LocalDate> availableDatesPreview
    ) {
    }

    private record CandidateOffer(
            Venue venue,
            VenueAddress address,
            VenueImage primaryImage,
            Availability availability
    ) {
    }
}
