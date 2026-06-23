package com.example.lendo.service;

import com.example.lendo.dto.CreateSmartPlannerBookingRequest;
import com.example.lendo.dto.RequestSmartPlannerCancellationRequest;
import com.example.lendo.dto.SmartPlannerBookingDecisionRequest;
import com.example.lendo.dto.SmartPlannerBookingListFilter;
import com.example.lendo.dto.SmartPlannerBookingListResponse;
import com.example.lendo.dto.SmartPlannerBookingResponse;
import com.example.lendo.dto.UpdateSmartPlannerBookingRequest;
import com.example.lendo.model.Booking;
import com.example.lendo.model.BookingRequestStatus;
import com.example.lendo.model.BookingStatus;
import com.example.lendo.model.GuestDietLogistics;
import com.example.lendo.model.User;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueCalendar;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.model.WeddDeal;
import com.example.lendo.repository.BookingRepository;
import com.example.lendo.repository.BookingStatusRepository;
import com.example.lendo.repository.ContractRepository;
import com.example.lendo.repository.GuestDietLogisticsRepository;
import com.example.lendo.repository.VenueCalendarRepository;
import com.example.lendo.repository.VenueRepository;
import com.example.lendo.repository.WeddDealRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SmartPlannerBookingService {
    private static final String AVAILABLE = "AVAILABLE";
    private static final String PROVISIONAL = "PROVISIONAL";
    private static final String CONFIRMED = "CONFIRMED";
    private static final long PROVISIONAL_HOLD_HOURS = 48;
    private static final EnumSet<BookingRequestStatus> MANAGER_DELETABLE_STATUSES = EnumSet.of(
            BookingRequestStatus.REJECTED,
            BookingRequestStatus.EXPIRED,
            BookingRequestStatus.CANCELLED
    );

    private final VenueRepository venueRepository;
    private final VenueCalendarRepository venueCalendarRepository;
    private final BookingStatusRepository bookingStatusRepository;
    private final BookingRepository bookingRepository;
    private final GuestDietLogisticsRepository guestDietLogisticsRepository;
    private final ContractRepository contractRepository;
    private final WeddDealRepository weddDealRepository;
    private final ObjectMapper objectMapper;
    private final EntityManager entityManager;

    @Transactional
    public SmartPlannerBookingResponse createBooking(User user, CreateSmartPlannerBookingRequest request) {
        Venue venue = venueRepository.findByIdAndStatus(request.venueId(), VenueStatus.APPROVED)
                .filter(Venue::isVerified)
                .orElseThrow(() -> new RuntimeException("Obiekt nie istnieje"));

        validateBookingData(
                venue,
                request.estimatedGuests(),
                request.maxPricePerGuest(),
                Boolean.TRUE.equals(request.fullService()),
                request.menuStandardCount(),
                request.menuVegetarianCount(),
                request.menuVeganCount(),
                request.menuGlutenFreeCount()
        );

        BookingStatus availableStatus = resolveCalendarStatus(AVAILABLE);
        BookingStatus provisionalStatus = resolveCalendarStatus(PROVISIONAL);

        VenueCalendar calendar = venueCalendarRepository.findByVenueIdAndEventDate(venue.getId(), request.eventDate())
                .map(existing -> prepareCalendarForSubmission(existing, availableStatus, provisionalStatus))
                .orElseGet(() -> venueCalendarRepository.save(
                        VenueCalendar.builder()
                                .venue(venue)
                                .eventDate(request.eventDate())
                                .status(provisionalStatus)
                                .provisionalExpiresAt(LocalDateTime.now().plusHours(PROVISIONAL_HOLD_HOURS))
                                .build()
                ));

        BigDecimal pricePerGuest = venue.getBasePricePerGuest();
        BigDecimal totalEstimatedCost = pricePerGuest.multiply(BigDecimal.valueOf(request.estimatedGuests()));

        Booking booking = bookingRepository.save(
                Booking.builder()
                        .client(user)
                        .venue(venue)
                        .calendar(calendar)
                        .estimatedGuests(request.estimatedGuests())
                        .pricePerGuest(pricePerGuest)
                        .maxPricePerGuest(request.maxPricePerGuest())
                        .totalEstimatedCost(totalEstimatedCost)
                        .fullService(Boolean.TRUE.equals(request.fullService()))
                        .serviceNotes(normalizeOptionalText(request.serviceNotes()))
                        .status(BookingRequestStatus.SUBMITTED)
                        .build()
        );

        GuestDietLogistics dietLogistics = guestDietLogisticsRepository.save(
                GuestDietLogistics.builder()
                        .booking(booking)
                        .menuStandardCount(request.menuStandardCount())
                        .menuVegetarianCount(request.menuVegetarianCount())
                        .menuVeganCount(request.menuVeganCount())
                        .menuGlutenFreeCount(request.menuGlutenFreeCount())
                        .allergiesNotes(normalizeOptionalText(request.allergiesNotes()))
                        .build()
        );

        return toBookingResponse(booking, dietLogistics);
    }

    @Transactional
    public SmartPlannerBookingResponse requestBookingUpdate(User user, Long bookingId, UpdateSmartPlannerBookingRequest request) {
        Booking booking = requireClientBooking(user, bookingId);

        if (booking.getStatus() != BookingRequestStatus.APPROVED && booking.getStatus() != BookingRequestStatus.CHANGE_REQUESTED) {
            throw new RuntimeException("Tylko zatwierdzony booking moze zostac zmieniony");
        }

        validateBookingData(
                booking.getVenue(),
                request.estimatedGuests(),
                request.maxPricePerGuest(),
                Boolean.TRUE.equals(request.fullService()),
                request.menuStandardCount(),
                request.menuVegetarianCount(),
                request.menuVeganCount(),
                request.menuGlutenFreeCount()
        );

        booking.setStatus(BookingRequestStatus.CHANGE_REQUESTED);
        booking.setClientRequestNotes(normalizeOptionalText(request.requestNotes()));
        booking.setPendingChangePayload(serializePendingChange(new PendingChangePayload(
                request.estimatedGuests(),
                request.maxPricePerGuest(),
                Boolean.TRUE.equals(request.fullService()),
                normalizeOptionalText(request.serviceNotes()),
                normalizeOptionalText(request.requestNotes()),
                request.menuStandardCount(),
                request.menuVegetarianCount(),
                request.menuVeganCount(),
                request.menuGlutenFreeCount(),
                normalizeOptionalText(request.allergiesNotes())
        )));
        booking.setDecisionComment(null);
        booking.setDecidedAt(null);

        GuestDietLogistics dietLogistics = requireDietLogistics(booking.getId());
        return toBookingResponse(booking, dietLogistics);
    }

    @Transactional
    public SmartPlannerBookingResponse requestBookingCancellation(User user, Long bookingId, RequestSmartPlannerCancellationRequest request) {
        Booking booking = requireClientBooking(user, bookingId);

        if (booking.getStatus() != BookingRequestStatus.APPROVED && booking.getStatus() != BookingRequestStatus.CANCELLATION_REQUESTED) {
            throw new RuntimeException("Tylko zatwierdzony booking moze zostac skierowany do anulacji");
        }

        booking.setStatus(BookingRequestStatus.CANCELLATION_REQUESTED);
        booking.setClientRequestNotes(normalizeOptionalText(request.reason()));
        booking.setPendingChangePayload(null);
        booking.setDecisionComment(null);
        booking.setDecidedAt(null);

        GuestDietLogistics dietLogistics = requireDietLogistics(booking.getId());
        return toBookingResponse(booking, dietLogistics);
    }

    @Transactional
    public SmartPlannerBookingListResponse getClientBookings(User user, SmartPlannerBookingListFilter filter) {
        return toBookingListResponse(bookingRepository.findAll(buildClientBookingSpecification(user, filter)));
    }

    @Transactional
    public SmartPlannerBookingResponse getBookingDetails(User user, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking nie istnieje"));

        boolean isAdmin = "ADMIN".equals(user.getRoleName());
        boolean isClient = booking.getClient().getId().equals(user.getId());
        boolean isManager = booking.getVenue().getManager().getId().equals(user.getId());

        if (!isAdmin && !isClient && !isManager) {
            throw new AccessDeniedException("Nie masz dostepu do tego bookingu");
        }

        expireIfNeeded(booking, resolveCalendarStatus(AVAILABLE));

        return toBookingResponse(booking, requireDietLogistics(booking.getId()));
    }

    @Transactional
    public SmartPlannerBookingListResponse getManagerBookings(User user, SmartPlannerBookingListFilter filter) {
        if ("ADMIN".equals(user.getRoleName())) {
            return toBookingListResponse(bookingRepository.findAll(buildAdminBookingSpecification(filter)));
        }
        return toBookingListResponse(bookingRepository.findAll(buildManagerBookingSpecification(user, filter)));
    }

    @Transactional
    public SmartPlannerBookingResponse decideBooking(User user, Long bookingId, SmartPlannerBookingDecisionRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking nie istnieje"));

        if (!"ADMIN".equals(user.getRoleName())
                && !booking.getVenue().getManager().getId().equals(user.getId())) {
            throw new AccessDeniedException("Nie masz dostepu do tego bookingu");
        }

        expireIfNeeded(booking, resolveCalendarStatus(AVAILABLE));

        return switch (booking.getStatus()) {
            case SUBMITTED -> decideInitialSubmission(booking, request);
            case CHANGE_REQUESTED -> decideChangeRequest(booking, request);
            case CANCELLATION_REQUESTED -> decideCancellationRequest(booking, request);
            default -> throw new RuntimeException("Ten booking nie oczekuje na decyzje managera");
        };
    }

    @Transactional
    public void deleteManagerBooking(User user, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking nie istnieje"));

        if (!"ADMIN".equals(user.getRoleName())
                && !booking.getVenue().getManager().getId().equals(user.getId())) {
            throw new AccessDeniedException("Nie masz dostepu do tego bookingu");
        }

        expireIfNeeded(booking, resolveCalendarStatus(AVAILABLE));

        if (!MANAGER_DELETABLE_STATUSES.contains(booking.getStatus())) {
            throw new RuntimeException("Mozna usuwac tylko zakonczone bookingi smartplannera");
        }

        GuestDietLogistics dietLogistics = requireDietLogistics(booking.getId());
        deleteBookingTraces(booking, dietLogistics);
    }

    private SmartPlannerBookingResponse decideInitialSubmission(Booking booking, SmartPlannerBookingDecisionRequest request) {
        BookingRequestStatus decision = parseInitialDecision(request.decision());
        BookingStatus availableStatus = resolveCalendarStatus(AVAILABLE);
        BookingStatus confirmedStatus = resolveCalendarStatus(CONFIRMED);

        booking.setStatus(decision);
        booking.setDecisionComment(normalizeOptionalText(request.comment()));
        booking.setDecidedAt(LocalDateTime.now());
        booking.setClientRequestNotes(null);

        if (decision == BookingRequestStatus.APPROVED) {
            booking.getCalendar().setStatus(confirmedStatus);
            booking.getCalendar().setProvisionalExpiresAt(null);
        } else {
            booking.getCalendar().setStatus(availableStatus);
            booking.getCalendar().setProvisionalExpiresAt(null);
        }

        return toBookingResponse(booking, requireDietLogistics(booking.getId()));
    }

    private SmartPlannerBookingResponse decideChangeRequest(Booking booking, SmartPlannerBookingDecisionRequest request) {
        ChangeDecision decision = parseChangeDecision(request.decision());
        GuestDietLogistics dietLogistics = requireDietLogistics(booking.getId());

        if (decision == ChangeDecision.APPROVE_CHANGES) {
            PendingChangePayload payload = requirePendingChangePayload(booking);
            applyPendingChange(booking, dietLogistics, payload);
        }

        booking.setStatus(BookingRequestStatus.APPROVED);
        booking.setClientRequestNotes(null);
        booking.setPendingChangePayload(null);
        booking.setDecisionComment(normalizeOptionalText(request.comment()));
        booking.setDecidedAt(LocalDateTime.now());

        return toBookingResponse(booking, dietLogistics);
    }

    private SmartPlannerBookingResponse decideCancellationRequest(Booking booking, SmartPlannerBookingDecisionRequest request) {
        CancellationDecision decision = parseCancellationDecision(request.decision());
        GuestDietLogistics dietLogistics = requireDietLogistics(booking.getId());

        if (decision == CancellationDecision.REJECT_CANCELLATION) {
            booking.setStatus(BookingRequestStatus.APPROVED);
            booking.setClientRequestNotes(null);
            booking.setDecisionComment(normalizeOptionalText(request.comment()));
            booking.setDecidedAt(LocalDateTime.now());
            return toBookingResponse(booking, dietLogistics);
        }

        if (decision == CancellationDecision.APPROVE_CANCELLATION_WEDDCHANCE) {
            createWeddChanceFromBooking(booking, request);
        }

        BookingStatus availableStatus = resolveCalendarStatus(AVAILABLE);
        booking.getCalendar().setStatus(availableStatus);
        booking.getCalendar().setProvisionalExpiresAt(null);
        booking.setStatus(BookingRequestStatus.CANCELLED);
        booking.setDecisionComment(normalizeOptionalText(request.comment()));
        booking.setDecidedAt(LocalDateTime.now());

        SmartPlannerBookingResponse response = toBookingResponse(booking, dietLogistics);
        deleteBookingTraces(booking, dietLogistics);
        return response;
    }

    private void createWeddChanceFromBooking(Booking booking, SmartPlannerBookingDecisionRequest request) {
        if (weddDealRepository.existsByCalendarId(booking.getCalendar().getId())) {
            throw new RuntimeException("Dla tego terminu istnieje juz oferta WeddChance");
        }

        WeddChancePricing pricing = resolveWeddChancePricing(booking.getVenue().getBasePricePerGuest(), request);

        if (pricing.specialPricePerGuest().compareTo(booking.getVenue().getBasePricePerGuest()) >= 0) {
            throw new RuntimeException("Cena specjalna musi byc nizsza niz standardowa cena obiektu");
        }

        boolean allowAdjustment = Boolean.TRUE.equals(request.allowGuestCountAdjustment());
        Integer minGuestCount = allowAdjustment ? request.minGuestCount() : null;
        Integer maxGuestCount = allowAdjustment ? request.maxGuestCount() : null;

        if (allowAdjustment && (minGuestCount == null || maxGuestCount == null || minGuestCount > maxGuestCount)) {
            throw new RuntimeException("Zakres liczby gosci dla WeddChance jest niepoprawny");
        }

        weddDealRepository.save(
                WeddDeal.builder()
                        .venue(booking.getVenue())
                        .calendar(booking.getCalendar())
                        .discountPercentage(pricing.discountPercentage())
                        .specialPricePerGuest(pricing.specialPricePerGuest())
                        .originalGuestCount(booking.getEstimatedGuests())
                        .allowGuestCountAdjustment(allowAdjustment)
                        .minGuestCount(minGuestCount)
                        .maxGuestCount(maxGuestCount)
                        .description(normalizeOptionalText(request.dealDescription()))
                        .active(true)
                        .build()
        );
    }

    private WeddChancePricing resolveWeddChancePricing(
            BigDecimal basePricePerGuest,
            SmartPlannerBookingDecisionRequest request
    ) {
        Integer discountPercentage = request.discountPercentage();
        BigDecimal specialPricePerGuest = request.specialPricePerGuest();

        if (discountPercentage == null && specialPricePerGuest == null) {
            throw new RuntimeException("Do stworzenia WeddChance podaj rabat albo cene specjalna");
        }

        if (discountPercentage != null && (discountPercentage < 1 || discountPercentage > 100)) {
            throw new RuntimeException("Rabat musi byc w zakresie 1-100");
        }

        if (specialPricePerGuest != null && specialPricePerGuest.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Cena specjalna nie moze byc ujemna");
        }

        if (specialPricePerGuest == null) {
            BigDecimal multiplier = BigDecimal.ONE.subtract(
                    BigDecimal.valueOf(discountPercentage).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
            );
            specialPricePerGuest = basePricePerGuest.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        }

        if (discountPercentage == null) {
            BigDecimal discountRatio = BigDecimal.ONE.subtract(
                    specialPricePerGuest.divide(basePricePerGuest, 4, RoundingMode.HALF_UP)
            );
            discountPercentage = discountRatio.multiply(BigDecimal.valueOf(100))
                    .setScale(0, RoundingMode.HALF_UP)
                    .intValueExact();
        }

        return new WeddChancePricing(discountPercentage, specialPricePerGuest);
    }

    private void deleteBookingTraces(Booking booking, GuestDietLogistics dietLogistics) {
        contractRepository.findByBookingId(booking.getId()).ifPresent(contractRepository::delete);
        entityManager.flush();

        entityManager.detach(dietLogistics);
        entityManager.detach(booking);

        guestDietLogisticsRepository.deleteByBookingId(booking.getId());
        guestDietLogisticsRepository.flush();

        bookingRepository.deleteById(booking.getId());
        bookingRepository.flush();
    }

    private void applyPendingChange(Booking booking, GuestDietLogistics dietLogistics, PendingChangePayload payload) {
        validateBookingData(
                booking.getVenue(),
                payload.estimatedGuests(),
                payload.maxPricePerGuest(),
                payload.fullService(),
                payload.menuStandardCount(),
                payload.menuVegetarianCount(),
                payload.menuVeganCount(),
                payload.menuGlutenFreeCount()
        );

        booking.setEstimatedGuests(payload.estimatedGuests());
        booking.setMaxPricePerGuest(payload.maxPricePerGuest());
        booking.setFullService(payload.fullService());
        booking.setServiceNotes(payload.serviceNotes());
        booking.setTotalEstimatedCost(booking.getPricePerGuest().multiply(BigDecimal.valueOf(payload.estimatedGuests())));

        dietLogistics.setMenuStandardCount(payload.menuStandardCount());
        dietLogistics.setMenuVegetarianCount(payload.menuVegetarianCount());
        dietLogistics.setMenuVeganCount(payload.menuVeganCount());
        dietLogistics.setMenuGlutenFreeCount(payload.menuGlutenFreeCount());
        dietLogistics.setAllergiesNotes(payload.allergiesNotes());
    }

    private SmartPlannerBookingListResponse toBookingListResponse(List<Booking> bookings) {
        List<Long> bookingIds = bookings.stream()
                .map(Booking::getId)
                .toList();
        Map<Long, GuestDietLogistics> dietLogisticsByBookingId = guestDietLogisticsRepository.findAllByBookingIdIn(bookingIds).stream()
                .collect(Collectors.toMap(GuestDietLogistics::getBookingId, logistics -> logistics));

        List<SmartPlannerBookingResponse> items = bookings.stream()
                .map(booking -> toBookingResponse(
                        booking,
                        requireDietLogistics(dietLogisticsByBookingId, booking.getId())
                ))
                .toList();

        Map<BookingRequestStatus, Long> counters = new EnumMap<>(BookingRequestStatus.class);
        for (BookingRequestStatus status : BookingRequestStatus.values()) {
            counters.put(status, 0L);
        }
        for (Booking booking : bookings) {
            counters.computeIfPresent(booking.getStatus(), (key, value) -> value + 1);
        }

        return new SmartPlannerBookingListResponse(
                items,
                new SmartPlannerBookingListResponse.Summary(
                        bookings.size(),
                        counters.get(BookingRequestStatus.SUBMITTED),
                        counters.get(BookingRequestStatus.APPROVED),
                        counters.get(BookingRequestStatus.CHANGE_REQUESTED),
                        counters.get(BookingRequestStatus.CANCELLATION_REQUESTED),
                        counters.get(BookingRequestStatus.REJECTED),
                        counters.get(BookingRequestStatus.EXPIRED),
                        counters.get(BookingRequestStatus.CANCELLED)
                )
        );
    }

    private SmartPlannerBookingResponse toBookingResponse(Booking booking, GuestDietLogistics dietLogistics) {
        PendingChangePayload payload = deserializePendingChange(booking.getPendingChangePayload());

        return SmartPlannerBookingResponse.from(
                booking,
                dietLogistics,
                payload == null ? null : new SmartPlannerBookingResponse.PendingChangePreview(
                        payload.estimatedGuests(),
                        payload.maxPricePerGuest(),
                        payload.fullService(),
                        payload.serviceNotes(),
                        payload.requestNotes(),
                        new SmartPlannerBookingResponse.DietLogistics(
                                payload.menuStandardCount(),
                                payload.menuVegetarianCount(),
                                payload.menuVeganCount(),
                                payload.menuGlutenFreeCount(),
                                payload.allergiesNotes()
                        )
                )
        );
    }

    private GuestDietLogistics requireDietLogistics(Map<Long, GuestDietLogistics> dietLogisticsByBookingId, Long bookingId) {
        GuestDietLogistics dietLogistics = dietLogisticsByBookingId.get(bookingId);
        if (dietLogistics == null) {
            throw new IllegalStateException("Brak danych logistycznych dla bookingu " + bookingId);
        }
        return dietLogistics;
    }

    private GuestDietLogistics requireDietLogistics(Long bookingId) {
        return guestDietLogisticsRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalStateException("Brak danych logistycznych dla bookingu " + bookingId));
    }

    private Booking requireClientBooking(User user, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking nie istnieje"));

        if (!booking.getClient().getId().equals(user.getId())) {
            throw new AccessDeniedException("Nie masz dostepu do tego bookingu");
        }

        return booking;
    }

    private void validateBookingData(
            Venue venue,
            Integer estimatedGuests,
            BigDecimal maxPricePerGuest,
            boolean fullService,
            Integer menuStandardCount,
            Integer menuVegetarianCount,
            Integer menuVeganCount,
            Integer menuGlutenFreeCount
    ) {
        int configuredMenus = menuStandardCount + menuVegetarianCount + menuVeganCount + menuGlutenFreeCount;

        if (fullService) {
            if (configuredMenus <= 0) {
                throw new RuntimeException("Musisz podac co najmniej jedno menu");
            }
        } else if (configuredMenus != 0) {
            throw new RuntimeException("Dla bookingu bez full service liczby menu musza byc rowne zero");
        }

        if (configuredMenus > estimatedGuests) {
            throw new RuntimeException("Suma menu nie moze przekraczac liczby gosci");
        }

        if (estimatedGuests < venue.getCapacityMin() || estimatedGuests > venue.getCapacityMax()) {
            throw new RuntimeException("Liczba gosci jest poza zakresem pojemnosci obiektu");
        }

        if (venue.getBasePricePerGuest().compareTo(maxPricePerGuest) > 0) {
            throw new RuntimeException("Obiekt przekracza maksymalna cene za osobe");
        }
    }

    private VenueCalendar prepareCalendarForSubmission(
            VenueCalendar calendar,
            BookingStatus availableStatus,
            BookingStatus provisionalStatus
    ) {
        expireIfNeeded(calendar, availableStatus);

        String statusName = calendar.getStatus().getStatusName();
        if (!AVAILABLE.equals(statusName)) {
            throw new RuntimeException("Wybrany termin nie jest dostepny");
        }

        if (bookingRepository.existsByCalendarIdAndStatusIn(
                calendar.getId(),
                List.of(
                        BookingRequestStatus.SUBMITTED,
                        BookingRequestStatus.APPROVED,
                        BookingRequestStatus.CHANGE_REQUESTED,
                        BookingRequestStatus.CANCELLATION_REQUESTED
                )
        )) {
            throw new RuntimeException("Dla tego terminu istnieje juz aktywne zgloszenie");
        }

        calendar.setStatus(provisionalStatus);
        calendar.setProvisionalExpiresAt(LocalDateTime.now().plusHours(PROVISIONAL_HOLD_HOURS));
        return calendar;
    }

    private void expireIfNeeded(Booking booking, BookingStatus availableStatus) {
        expireIfNeeded(booking.getCalendar(), availableStatus);
        if (booking.getStatus() == BookingRequestStatus.SUBMITTED
                && booking.getCalendar().getStatus().getStatusName().equals(AVAILABLE)) {
            booking.setStatus(BookingRequestStatus.EXPIRED);
            booking.setDecisionComment("Wstepna rezerwacja wygasla");
            booking.setDecidedAt(LocalDateTime.now());
        }
    }

    private void expireIfNeeded(VenueCalendar calendar, BookingStatus availableStatus) {
        if (!PROVISIONAL.equals(calendar.getStatus().getStatusName())) {
            return;
        }

        if (calendar.getProvisionalExpiresAt() != null && calendar.getProvisionalExpiresAt().isAfter(LocalDateTime.now())) {
            return;
        }

        calendar.setStatus(availableStatus);
        calendar.setProvisionalExpiresAt(null);

        List<Booking> expiredBookings = bookingRepository.findAllByCalendarIdAndStatusIn(
                calendar.getId(),
                List.of(BookingRequestStatus.SUBMITTED)
        );
        for (Booking expiredBooking : expiredBookings) {
            expiredBooking.setStatus(BookingRequestStatus.EXPIRED);
            expiredBooking.setDecisionComment("Wstepna rezerwacja wygasla");
            expiredBooking.setDecidedAt(LocalDateTime.now());
        }
    }

    private BookingRequestStatus parseInitialDecision(String rawDecision) {
        try {
            BookingRequestStatus decision = BookingRequestStatus.valueOf(rawDecision.trim().toUpperCase(Locale.ROOT));
            if (decision != BookingRequestStatus.APPROVED && decision != BookingRequestStatus.REJECTED) {
                throw new IllegalArgumentException("unsupported");
            }
            return decision;
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Decyzja dla nowego bookingu musi miec wartosc APPROVED albo REJECTED");
        }
    }

    private ChangeDecision parseChangeDecision(String rawDecision) {
        return switch (rawDecision.trim().toUpperCase(Locale.ROOT)) {
            case "APPROVE_CHANGES" -> ChangeDecision.APPROVE_CHANGES;
            case "REJECT_CHANGES" -> ChangeDecision.REJECT_CHANGES;
            default -> throw new RuntimeException("Decyzja dla zmian musi miec wartosc APPROVE_CHANGES albo REJECT_CHANGES");
        };
    }

    private CancellationDecision parseCancellationDecision(String rawDecision) {
        return switch (rawDecision.trim().toUpperCase(Locale.ROOT)) {
            case "APPROVE_CANCELLATION_REMOVE" -> CancellationDecision.APPROVE_CANCELLATION_REMOVE;
            case "APPROVE_CANCELLATION_WEDDCHANCE" -> CancellationDecision.APPROVE_CANCELLATION_WEDDCHANCE;
            case "REJECT_CANCELLATION" -> CancellationDecision.REJECT_CANCELLATION;
            default -> throw new RuntimeException("Nieobslugiwany typ decyzji dla anulacji");
        };
    }

    private BookingStatus resolveCalendarStatus(String statusName) {
        return bookingStatusRepository.findByStatusName(statusName)
                .orElseThrow(() -> new RuntimeException("Brak statusu " + statusName + " w systemie"));
    }

    private String normalizeOptionalText(String value) {
        return value != null && !value.isBlank() ? value.trim() : null;
    }

    private String serializePendingChange(PendingChangePayload payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new RuntimeException("Nie udalo sie zapisac zmian bookingu");
        }
    }

    private PendingChangePayload deserializePendingChange(String payload) {
        if (payload == null || payload.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readValue(payload, PendingChangePayload.class);
        } catch (JsonProcessingException ex) {
            throw new RuntimeException("Nie udalo sie odczytac zmian bookingu");
        }
    }

    private PendingChangePayload requirePendingChangePayload(Booking booking) {
        PendingChangePayload payload = deserializePendingChange(booking.getPendingChangePayload());
        if (payload == null) {
            throw new RuntimeException("Brak zapisanej propozycji zmian");
        }
        return payload;
    }

    private org.springframework.data.jpa.domain.Specification<Booking> buildClientBookingSpecification(
            User user,
            SmartPlannerBookingListFilter filter
    ) {
        return (root, query, cb) -> cb.and(
                cb.equal(root.get("client").get("id"), user.getId()),
                buildFilterPredicate(root, cb, filter)
        );
    }

    private org.springframework.data.jpa.domain.Specification<Booking> buildManagerBookingSpecification(
            User user,
            SmartPlannerBookingListFilter filter
    ) {
        return (root, query, cb) -> cb.and(
                cb.equal(root.get("venue").get("manager").get("id"), user.getId()),
                buildFilterPredicate(root, cb, filter)
        );
    }

    private org.springframework.data.jpa.domain.Specification<Booking> buildAdminBookingSpecification(
            SmartPlannerBookingListFilter filter
    ) {
        return (root, query, cb) -> buildFilterPredicate(root, cb, filter);
    }

    private Predicate buildFilterPredicate(
            Root<Booking> root,
            CriteriaBuilder cb,
            SmartPlannerBookingListFilter filter
    ) {
        List<Predicate> predicates = new ArrayList<>();

        if (filter != null && filter.status() != null && !filter.status().isBlank()) {
            predicates.add(cb.equal(root.get("status"), parseBookingStatus(filter.status())));
        }

        if (filter != null && filter.eventDateFrom() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("calendar").get("eventDate"), filter.eventDateFrom()));
        }

        if (filter != null && filter.eventDateTo() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("calendar").get("eventDate"), filter.eventDateTo()));
        }

        return cb.and(predicates.toArray(Predicate[]::new));
    }

    private BookingRequestStatus parseBookingStatus(String rawStatus) {
        try {
            return BookingRequestStatus.valueOf(rawStatus.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Nieobslugiwany status bookingu");
        }
    }

    private enum ChangeDecision {
        APPROVE_CHANGES,
        REJECT_CHANGES
    }

    private enum CancellationDecision {
        APPROVE_CANCELLATION_REMOVE,
        APPROVE_CANCELLATION_WEDDCHANCE,
        REJECT_CANCELLATION
    }

    private record PendingChangePayload(
            Integer estimatedGuests,
            BigDecimal maxPricePerGuest,
            boolean fullService,
            String serviceNotes,
            String requestNotes,
            Integer menuStandardCount,
            Integer menuVegetarianCount,
            Integer menuVeganCount,
            Integer menuGlutenFreeCount,
            String allergiesNotes
    ) {
    }

    private record WeddChancePricing(
            Integer discountPercentage,
            BigDecimal specialPricePerGuest
    ) {
    }
}
