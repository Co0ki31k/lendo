package com.example.lendo.service;

import com.example.lendo.dto.SubmitWeddChanceOfferRequest;
import com.example.lendo.dto.WeddChanceSubmissionResponse;
import com.example.lendo.model.BookingStatus;
import com.example.lendo.model.User;
import com.example.lendo.model.VenueCalendar;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.model.WeddDeal;
import com.example.lendo.model.WeddChanceBooking;
import com.example.lendo.model.WeddChanceBookingStatus;
import com.example.lendo.repository.BookingStatusRepository;
import com.example.lendo.repository.WeddDealRepository;
import com.example.lendo.repository.WeddChanceBookingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WeddChanceSubmissionService {
    private static final String AVAILABLE = "AVAILABLE";
    private static final String PROVISIONAL = "PROVISIONAL";
    private static final long PROVISIONAL_HOLD_HOURS = 48;

    private final WeddDealRepository weddDealRepository;
    private final BookingStatusRepository bookingStatusRepository;
    private final WeddChanceBookingRepository weddChanceBookingRepository;

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

        BookingStatus provisionalStatus = bookingStatusRepository.findByStatusName(PROVISIONAL)
                .orElseThrow(() -> new RuntimeException("Brak statusu PROVISIONAL w systemie"));

        LocalDateTime provisionalExpiresAt = LocalDateTime.now().plusHours(PROVISIONAL_HOLD_HOURS);
        calendar.setStatus(provisionalStatus);
        calendar.setProvisionalExpiresAt(provisionalExpiresAt);

        BigDecimal totalEstimatedCost = deal.getSpecialPricePerGuest()
                .multiply(BigDecimal.valueOf(request.guestCount()));

        WeddChanceBooking booking = weddChanceBookingRepository.save(
                WeddChanceBooking.builder()
                        .deal(deal)
                        .client(user)
                        .venue(deal.getVenue())
                        .calendar(calendar)
                        .guestCount(request.guestCount())
                        .specialPricePerGuest(deal.getSpecialPricePerGuest())
                        .totalEstimatedCost(totalEstimatedCost)
                        .messageText(request.message() != null && !request.message().isBlank() ? request.message().trim() : null)
                        .status(WeddChanceBookingStatus.SUBMITTED)
                        .provisionalExpiresAt(provisionalExpiresAt)
                        .build()
        );

        return WeddChanceSubmissionResponse.from(booking);
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
}
