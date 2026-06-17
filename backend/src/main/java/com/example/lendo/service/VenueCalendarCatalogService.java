package com.example.lendo.service;

import com.example.lendo.dto.VenueCalendarDayResponse;
import com.example.lendo.dto.VenueCalendarResponse;
import com.example.lendo.model.User;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueCalendar;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.repository.VenueCalendarRepository;
import com.example.lendo.repository.VenueRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class VenueCalendarCatalogService {
    private static final long MAX_RANGE_DAYS = 366;
    private static final String AVAILABLE = "AVAILABLE";
    private static final String PROVISIONAL = "PROVISIONAL";

    private final VenueRepository venueRepository;
    private final VenueCalendarRepository venueCalendarRepository;

    @Transactional
    public VenueCalendarResponse getApprovedVenueCalendar(Long venueId, LocalDate from, LocalDate to) {
        Venue venue = venueRepository.findByIdAndStatus(venueId, VenueStatus.APPROVED)
                .filter(Venue::isVerified)
                .orElseThrow(() -> new RuntimeException("Obiekt nie istnieje"));

        return buildVenueCalendarResponse(venue, from, to);
    }

    @Transactional
    public VenueCalendarResponse getManagedVenueCalendar(User user, Long venueId, LocalDate from, LocalDate to) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new RuntimeException("Obiekt nie istnieje"));

        if (!"ADMIN".equals(user.getRoleName()) && !venue.getManager().getId().equals(user.getId())) {
            throw new RuntimeException("Nie masz dostepu do tego obiektu");
        }

        return buildVenueCalendarResponse(venue, from, to);
    }

    private VenueCalendarResponse buildVenueCalendarResponse(Venue venue, LocalDate from, LocalDate to) {

        DateRange dateRange = resolveDateRange(from, to);

        Map<LocalDate, VenueCalendar> entriesByDate = venueCalendarRepository
                .findByVenueIdAndEventDateBetweenOrderByEventDateAsc(venue.getId(), dateRange.from(), dateRange.to())
                .stream()
                .collect(Collectors.toMap(VenueCalendar::getEventDate, entry -> entry));

        List<VenueCalendarDayResponse> days = dateRange.from()
                .datesUntil(dateRange.to().plusDays(1))
                .map(date -> toDayResponse(date, entriesByDate.get(date)))
                .toList();

        return new VenueCalendarResponse(venue.getId(), dateRange.from(), dateRange.to(), days);
    }

    private VenueCalendarDayResponse toDayResponse(LocalDate date, VenueCalendar entry) {
        if (entry == null) {
            return new VenueCalendarDayResponse(date, AVAILABLE, null);
        }

        String status = entry.getStatus().getStatusName();
        LocalDateTime provisionalExpiresAt = entry.getProvisionalExpiresAt();

        if (PROVISIONAL.equals(status) && provisionalExpiresAt != null && provisionalExpiresAt.isBefore(LocalDateTime.now())) {
            return new VenueCalendarDayResponse(date, AVAILABLE, null);
        }

        return new VenueCalendarDayResponse(date, status, provisionalExpiresAt);
    }

    private DateRange resolveDateRange(LocalDate from, LocalDate to) {
        LocalDate resolvedFrom = from;
        LocalDate resolvedTo = to;

        if (resolvedFrom == null && resolvedTo == null) {
            resolvedFrom = LocalDate.now().withDayOfMonth(1);
            resolvedTo = resolvedFrom.plusMonths(2).withDayOfMonth(resolvedFrom.plusMonths(2).lengthOfMonth());
        } else if (resolvedFrom == null || resolvedTo == null) {
            throw new RuntimeException("Parametry from i to musza byc podane razem");
        }

        if (resolvedTo.isBefore(resolvedFrom)) {
            throw new RuntimeException("Parametr to nie moze byc wczesniejszy niz from");
        }

        long days = ChronoUnit.DAYS.between(resolvedFrom, resolvedTo) + 1;
        if (days > MAX_RANGE_DAYS) {
            throw new RuntimeException("Zakres kalendarza nie moze byc dluzszy niz 366 dni");
        }

        return new DateRange(resolvedFrom, resolvedTo);
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }
}
