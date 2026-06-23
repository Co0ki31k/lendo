package com.example.lendo.service;

import com.example.lendo.dto.SubmitWeddChanceOfferRequest;
import com.example.lendo.dto.WeddChanceSubmissionResponse;
import com.example.lendo.model.Booking;
import com.example.lendo.model.BookingStatus;
import com.example.lendo.model.BookingRequestStatus;
import com.example.lendo.model.GuestDietLogistics;
import com.example.lendo.model.User;
import com.example.lendo.model.VenueCalendar;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.model.WeddDeal;
import com.example.lendo.model.WeddChanceBooking;
import com.example.lendo.model.WeddChanceBookingStatus;
import com.example.lendo.repository.BookingRepository;
import com.example.lendo.repository.BookingStatusRepository;
import com.example.lendo.repository.GuestDietLogisticsRepository;
import com.example.lendo.repository.WeddDealRepository;
import com.example.lendo.repository.WeddChanceBookingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WeddChanceSubmissionService {
    private static final String AVAILABLE = "AVAILABLE";
    private static final String PROVISIONAL = "PROVISIONAL";
    private static final String CONFIRMED = "CONFIRMED";

    private final WeddDealRepository weddDealRepository;
    private final BookingStatusRepository bookingStatusRepository;
    private final WeddChanceBookingRepository weddChanceBookingRepository;
    private final BookingRepository bookingRepository;
    private final GuestDietLogisticsRepository guestDietLogisticsRepository;

    @Transactional
    public WeddChanceSubmissionResponse submitOffer(User user, Long dealId, SubmitWeddChanceOfferRequest request) {
        WeddDeal deal = weddDealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Oferta nie istnieje"));

        validateDealIsSubmittable(deal);
        validateGuestCount(deal, request.guestCount());

        VenueCalendar calendar = deal.getCalendar();
        if (weddChanceBookingRepository.existsByCalendarIdAndStatusIn(
                calendar.getId(),
                List.of(WeddChanceBookingStatus.SUBMITTED, WeddChanceBookingStatus.ACCEPTED)
        )) {
            throw new RuntimeException("Dla tego terminu istnieje juz aktywne zgloszenie WeddChance");
        }

        BookingStatus confirmedStatus = bookingStatusRepository.findByStatusName(CONFIRMED)
                .orElseThrow(() -> new RuntimeException("Brak statusu CONFIRMED w systemie"));

        calendar.setStatus(confirmedStatus);
        calendar.setProvisionalExpiresAt(null);

        BigDecimal totalEstimatedCost = deal.getSpecialPricePerGuest()
                .multiply(BigDecimal.valueOf(request.guestCount()));

        WeddChanceBooking weddChanceBooking = weddChanceBookingRepository.save(
                WeddChanceBooking.builder()
                        .deal(deal)
                        .client(user)
                        .venue(deal.getVenue())
                        .calendar(calendar)
                        .guestCount(request.guestCount())
                        .specialPricePerGuest(deal.getSpecialPricePerGuest())
                        .totalEstimatedCost(totalEstimatedCost)
                        .messageText(request.message() != null && !request.message().isBlank() ? request.message().trim() : null)
                        .status(WeddChanceBookingStatus.ACCEPTED)
                        .provisionalExpiresAt(LocalDateTime.now())
                        .build()
        );

        createAcceptedBookingFromDeal(user, deal, weddChanceBooking);
        deal.setActive(false);

        return WeddChanceSubmissionResponse.from(weddChanceBooking);
    }

    private void validateDealIsSubmittable(WeddDeal deal) {
        if (!deal.isActive()) {
            throw new RuntimeException("Oferta nie jest aktywna");
        }

        if (deal.getVenue().getStatus() != VenueStatus.APPROVED || !deal.getVenue().isVerified()) {
            throw new RuntimeException("Obiekt nie jest dostepny");
        }

        if (deal.getCalendar().getEventDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Termin oferty juz minal");
        }

        String statusName = deal.getCalendar().getStatus().getStatusName();
        if (AVAILABLE.equals(statusName)) {
            return;
        }

        if (PROVISIONAL.equals(statusName)) {
            LocalDateTime provisionalExpiresAt = deal.getCalendar().getProvisionalExpiresAt();
            if (provisionalExpiresAt != null && provisionalExpiresAt.isBefore(LocalDateTime.now())) {
                return;
            }
        }

        throw new RuntimeException("Termin oferty nie jest juz dostepny");
    }

    private void createAcceptedBookingFromDeal(User user, WeddDeal deal, WeddChanceBooking weddChanceBooking) {
        Booking booking = bookingRepository.save(
                Booking.builder()
                        .client(user)
                        .venue(deal.getVenue())
                        .calendar(deal.getCalendar())
                        .estimatedGuests(weddChanceBooking.getGuestCount())
                        .pricePerGuest(weddChanceBooking.getSpecialPricePerGuest())
                        .maxPricePerGuest(weddChanceBooking.getSpecialPricePerGuest())
                        .totalEstimatedCost(weddChanceBooking.getTotalEstimatedCost())
                        .fullService(deal.isSourceFullService())
                        .serviceNotes(deal.getSourceServiceNotes())
                        .clientRequestNotes(weddChanceBooking.getMessageText())
                        .status(BookingRequestStatus.APPROVED)
                        .decisionComment("Booking utworzony z zaakceptowanej oferty WeddChance")
                        .decidedAt(LocalDateTime.now())
                        .build()
        );

        DietCounts scaledDietCounts = scaleDietCounts(deal, weddChanceBooking.getGuestCount());

        guestDietLogisticsRepository.save(
                GuestDietLogistics.builder()
                        .booking(booking)
                        .menuStandardCount(scaledDietCounts.standard())
                        .menuVegetarianCount(scaledDietCounts.vegetarian())
                        .menuVeganCount(scaledDietCounts.vegan())
                        .menuGlutenFreeCount(scaledDietCounts.glutenFree())
                        .allergiesNotes(deal.getSourceAllergiesNotes())
                        .build()
        );
    }

    private DietCounts scaleDietCounts(WeddDeal deal, Integer guestCount) {
        if (deal.getOriginalGuestCount() == null || deal.getOriginalGuestCount() <= 0 || guestCount.equals(deal.getOriginalGuestCount())) {
            return new DietCounts(
                    deal.getSourceMenuStandardCount(),
                    deal.getSourceMenuVegetarianCount(),
                    deal.getSourceMenuVeganCount(),
                    deal.getSourceMenuGlutenFreeCount()
            );
        }

        BigDecimal ratio = BigDecimal.valueOf(guestCount)
                .divide(BigDecimal.valueOf(deal.getOriginalGuestCount()), 4, RoundingMode.HALF_UP);

        int standard = scaleCount(deal.getSourceMenuStandardCount(), ratio);
        int vegetarian = scaleCount(deal.getSourceMenuVegetarianCount(), ratio);
        int vegan = scaleCount(deal.getSourceMenuVeganCount(), ratio);
        int glutenFree = scaleCount(deal.getSourceMenuGlutenFreeCount(), ratio);

        int total = standard + vegetarian + vegan + glutenFree;
        while (total > guestCount && standard > 0) {
            standard--;
            total--;
        }
        while (total > guestCount && vegetarian > 0) {
            vegetarian--;
            total--;
        }
        while (total > guestCount && vegan > 0) {
            vegan--;
            total--;
        }
        while (total > guestCount && glutenFree > 0) {
            glutenFree--;
            total--;
        }

        return new DietCounts(standard, vegetarian, vegan, glutenFree);
    }

    private int scaleCount(Integer originalCount, BigDecimal ratio) {
        if (originalCount == null || originalCount == 0) {
            return 0;
        }
        return BigDecimal.valueOf(originalCount)
                .multiply(ratio)
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
    }

    private void validateGuestCount(WeddDeal deal, Integer guestCount) {
        if (!deal.isAllowGuestCountAdjustment()) {
            if (!deal.getOriginalGuestCount().equals(guestCount)) {
                throw new RuntimeException("Ta oferta wymaga dokladnie tej samej liczby gosci");
            }
            return;
        }

        if (deal.getMinGuestCount() == null || deal.getMaxGuestCount() == null) {
            throw new RuntimeException("Oferta ma niepelna konfiguracje liczby gosci");
        }

        if (guestCount < deal.getMinGuestCount() || guestCount > deal.getMaxGuestCount()) {
            throw new RuntimeException("Liczba gosci jest poza dozwolonym zakresem tej oferty");
        }
    }

    private record DietCounts(
            int standard,
            int vegetarian,
            int vegan,
            int glutenFree
    ) {
    }
}
