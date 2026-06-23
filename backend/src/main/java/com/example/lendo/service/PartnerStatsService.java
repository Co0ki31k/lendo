package com.example.lendo.service;

import com.example.lendo.dto.PartnerStatsOverviewResponse;
import com.example.lendo.model.Booking;
import com.example.lendo.model.BookingRequestStatus;
import com.example.lendo.model.GuestDietLogistics;
import com.example.lendo.model.User;
import com.example.lendo.model.UserFavorite;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueInquiry;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.model.WeddChanceBooking;
import com.example.lendo.model.WeddDeal;
import com.example.lendo.repository.BookingRepository;
import com.example.lendo.repository.GuestDietLogisticsRepository;
import com.example.lendo.repository.PartnerProfileRepository;
import com.example.lendo.repository.UserFavoriteRepository;
import com.example.lendo.repository.VenueInquiryRepository;
import com.example.lendo.repository.VenueRepository;
import com.example.lendo.repository.WeddChanceBookingRepository;
import com.example.lendo.repository.WeddDealRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PartnerStatsService {
    private static final int MONTH_WINDOW = 6;
    private static final DateTimeFormatter MONTH_LABEL_FORMATTER = DateTimeFormatter.ofPattern("MM.yyyy");

    private final VenueRepository venueRepository;
    private final BookingRepository bookingRepository;
    private final GuestDietLogisticsRepository guestDietLogisticsRepository;
    private final VenueInquiryRepository venueInquiryRepository;
    private final UserFavoriteRepository userFavoriteRepository;
    private final WeddDealRepository weddDealRepository;
    private final WeddChanceBookingRepository weddChanceBookingRepository;
    private final PartnerProfileRepository partnerProfileRepository;

    @Transactional(readOnly = true)
    public PartnerStatsOverviewResponse getOverview(User user) {
        requireStatsAccess(user);

        List<Venue> venues = venueRepository.findAllByManagerIdOrderByCreatedAtDesc(user.getId());
        if (venues.isEmpty()) {
            return emptyResponse();
        }

        List<Long> venueIds = venues.stream()
                .map(Venue::getId)
                .toList();

        List<Booking> bookings = bookingRepository.findAllByVenueManagerIdOrderByCreatedAtDesc(user.getId());
        List<Long> bookingIds = bookings.stream()
                .map(Booking::getId)
                .toList();
        Map<Long, GuestDietLogistics> dietLogisticsByBookingId = bookingIds.isEmpty()
                ? Map.of()
                : guestDietLogisticsRepository.findAllByBookingIdIn(bookingIds).stream()
                .collect(Collectors.toMap(GuestDietLogistics::getBookingId, Function.identity()));

        List<VenueInquiry> inquiries = venueInquiryRepository.findAllByVenueIdIn(venueIds);
        List<UserFavorite> favorites = userFavoriteRepository.findAllByVenueIdIn(venueIds);
        List<WeddDeal> activeDeals = weddDealRepository.findAllByVenueManagerIdAndActiveTrue(user.getId());
        List<WeddChanceBooking> weddChanceBookings = weddChanceBookingRepository.findAllByVenueManagerId(user.getId());

        return new PartnerStatsOverviewResponse(
                buildOverviewKpi(venues, bookings, inquiries, favorites, activeDeals),
                buildVenueStats(venues),
                buildBookingStats(bookings, dietLogisticsByBookingId),
                new PartnerStatsOverviewResponse.DemandStats(inquiries.size(), favorites.size()),
                buildWeddChanceStats(activeDeals, weddChanceBookings),
                buildMonthlyTrends(venues, bookings, inquiries, favorites),
                buildTopVenueStats(venues, bookings, inquiries, favorites)
        );
    }

    private void requireStatsAccess(User user) {
        if ("ADMIN".equals(user.getRoleName())) {
            return;
        }
        if (!"MANAGER".equals(user.getRoleName())) {
            throw new AccessDeniedException("Nie masz dostepu do statystyk partnera");
        }
        if (!partnerProfileRepository.existsById(user.getId())) {
            throw new RuntimeException("Najpierw uzupelnij profil partnera");
        }
    }

    private PartnerStatsOverviewResponse emptyResponse() {
        return new PartnerStatsOverviewResponse(
                new PartnerStatsOverviewResponse.OverviewKpi(0, 0, 0, 0, BigDecimal.ZERO, 0, 0, 0),
                new PartnerStatsOverviewResponse.VenueStats(
                        0, 0, 0, 0, 0,
                        BigDecimal.ZERO, 0, 0, 0, 0,
                        List.of(), List.of()
                ),
                new PartnerStatsOverviewResponse.BookingStats(
                        0, 0, 0, 0, 0, 0, 0, 0,
                        0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0L,
                        0, 0,
                        new PartnerStatsOverviewResponse.DietTotals(0, 0, 0, 0)
                ),
                new PartnerStatsOverviewResponse.DemandStats(0, 0),
                new PartnerStatsOverviewResponse.WeddChanceStats(0, BigDecimal.ZERO, BigDecimal.ZERO, 0, BigDecimal.ZERO),
                buildEmptyMonthlyTrends(),
                List.of()
        );
    }

    private PartnerStatsOverviewResponse.OverviewKpi buildOverviewKpi(
            List<Venue> venues,
            List<Booking> bookings,
            List<VenueInquiry> inquiries,
            List<UserFavorite> favorites,
            List<WeddDeal> activeDeals
    ) {
        long approvedVenues = venues.stream()
                .filter(venue -> venue.getStatus() == VenueStatus.APPROVED)
                .count();

        long activeBookings = bookings.stream()
                .filter(booking -> switch (booking.getStatus()) {
                    case SUBMITTED, APPROVED, CHANGE_REQUESTED, CANCELLATION_REQUESTED -> true;
                    default -> false;
                })
                .count();

        long approvedBookings = bookings.stream()
                .filter(booking -> booking.getStatus() == BookingRequestStatus.APPROVED)
                .count();

        BigDecimal approvedEstimatedRevenue = bookings.stream()
                .filter(booking -> booking.getStatus() == BookingRequestStatus.APPROVED)
                .map(Booking::getTotalEstimatedCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new PartnerStatsOverviewResponse.OverviewKpi(
                venues.size(),
                approvedVenues,
                activeBookings,
                approvedBookings,
                approvedEstimatedRevenue,
                inquiries.size(),
                favorites.size(),
                activeDeals.size()
        );
    }

    private PartnerStatsOverviewResponse.VenueStats buildVenueStats(List<Venue> venues) {
        Map<String, Long> byStyle = venues.stream()
                .collect(Collectors.groupingBy(Venue::getStyle, Collectors.counting()));
        Map<String, Long> byVoivodeship = venues.stream()
                .filter(venue -> venue.getAddress() != null && venue.getAddress().getVoivodeship() != null)
                .collect(Collectors.groupingBy(venue -> venue.getAddress().getVoivodeship(), Collectors.counting()));

        return new PartnerStatsOverviewResponse.VenueStats(
                venues.size(),
                countByVenueStatus(venues, VenueStatus.APPROVED),
                countByVenueStatus(venues, VenueStatus.PENDING),
                countByVenueStatus(venues, VenueStatus.DRAFT),
                countByVenueStatus(venues, VenueStatus.REJECTED),
                averageBigDecimal(venues.stream().map(Venue::getBasePricePerGuest).toList()),
                averageInteger(venues.stream().map(Venue::getCapacityMin).toList()),
                averageInteger(venues.stream().map(Venue::getCapacityMax).toList()),
                venues.stream().filter(Venue::isHasAccommodation).count(),
                venues.stream().filter(Venue::isCivilWeddingGarden).count(),
                toLabeledCounts(byStyle),
                toLabeledCounts(byVoivodeship)
        );
    }

    private PartnerStatsOverviewResponse.BookingStats buildBookingStats(
            List<Booking> bookings,
            Map<Long, GuestDietLogistics> dietLogisticsByBookingId
    ) {
        Map<BookingRequestStatus, Long> counts = new EnumMap<>(BookingRequestStatus.class);
        for (BookingRequestStatus status : BookingRequestStatus.values()) {
            counts.put(status, 0L);
        }
        bookings.forEach(booking -> counts.computeIfPresent(booking.getStatus(), (key, value) -> value + 1));

        List<BigDecimal> prices = bookings.stream()
                .map(Booking::getPricePerGuest)
                .toList();

        BigDecimal totalEstimatedRevenue = bookings.stream()
                .map(Booking::getTotalEstimatedCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal approvedEstimatedRevenue = bookings.stream()
                .filter(booking -> booking.getStatus() == BookingRequestStatus.APPROVED)
                .map(Booking::getTotalEstimatedCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalDecisionHours = bookings.stream()
                .filter(booking -> booking.getCreatedAt() != null && booking.getDecidedAt() != null)
                .mapToLong(booking -> java.time.Duration.between(booking.getCreatedAt(), booking.getDecidedAt()).toHours())
                .sum();
        long totalDecidedBookings = bookings.stream()
                .filter(booking -> booking.getCreatedAt() != null && booking.getDecidedAt() != null)
                .count();

        long standard = 0;
        long vegetarian = 0;
        long vegan = 0;
        long glutenFree = 0;
        for (GuestDietLogistics logistics : dietLogisticsByBookingId.values()) {
            standard += logistics.getMenuStandardCount();
            vegetarian += logistics.getMenuVegetarianCount();
            vegan += logistics.getMenuVeganCount();
            glutenFree += logistics.getMenuGlutenFreeCount();
        }

        return new PartnerStatsOverviewResponse.BookingStats(
                bookings.size(),
                counts.get(BookingRequestStatus.SUBMITTED),
                counts.get(BookingRequestStatus.APPROVED),
                counts.get(BookingRequestStatus.CHANGE_REQUESTED),
                counts.get(BookingRequestStatus.CANCELLATION_REQUESTED),
                counts.get(BookingRequestStatus.REJECTED),
                counts.get(BookingRequestStatus.EXPIRED),
                counts.get(BookingRequestStatus.CANCELLED),
                averageInteger(bookings.stream().map(Booking::getEstimatedGuests).toList()),
                averageBigDecimal(prices),
                totalEstimatedRevenue,
                approvedEstimatedRevenue,
                totalDecidedBookings > 0 ? totalDecisionHours / totalDecidedBookings : 0L,
                bookings.stream().filter(Booking::isFullService).count(),
                bookings.stream().filter(booking -> !booking.isFullService()).count(),
                new PartnerStatsOverviewResponse.DietTotals(standard, vegetarian, vegan, glutenFree)
        );
    }

    private PartnerStatsOverviewResponse.WeddChanceStats buildWeddChanceStats(
            List<WeddDeal> activeDeals,
            List<WeddChanceBooking> weddChanceBookings
    ) {
        BigDecimal averageDiscount = averageIntegerAsBigDecimal(activeDeals.stream()
                .map(WeddDeal::getDiscountPercentage)
                .toList());
        BigDecimal averageSpecialPrice = averageBigDecimal(activeDeals.stream()
                .map(WeddDeal::getSpecialPricePerGuest)
                .toList());
        BigDecimal totalEstimatedRevenue = weddChanceBookings.stream()
                .map(WeddChanceBooking::getTotalEstimatedCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new PartnerStatsOverviewResponse.WeddChanceStats(
                activeDeals.size(),
                averageDiscount,
                averageSpecialPrice,
                weddChanceBookings.size(),
                totalEstimatedRevenue
        );
    }

    private List<PartnerStatsOverviewResponse.MonthlyTrendPoint> buildMonthlyTrends(
            List<Venue> venues,
            List<Booking> bookings,
            List<VenueInquiry> inquiries,
            List<UserFavorite> favorites
    ) {
        List<YearMonth> months = rollingMonths();

        Map<YearMonth, Long> venueCounts = venues.stream()
                .filter(venue -> venue.getCreatedAt() != null)
                .collect(Collectors.groupingBy(venue -> YearMonth.from(venue.getCreatedAt()), Collectors.counting()));
        Map<YearMonth, Long> bookingCounts = bookings.stream()
                .filter(booking -> booking.getCreatedAt() != null)
                .collect(Collectors.groupingBy(booking -> YearMonth.from(booking.getCreatedAt()), Collectors.counting()));
        Map<YearMonth, Long> inquiryCounts = inquiries.stream()
                .filter(inquiry -> inquiry.getCreatedAt() != null)
                .collect(Collectors.groupingBy(inquiry -> YearMonth.from(inquiry.getCreatedAt()), Collectors.counting()));
        Map<YearMonth, Long> favoriteCounts = favorites.stream()
                .filter(favorite -> favorite.getAddedAt() != null)
                .collect(Collectors.groupingBy(favorite -> YearMonth.from(favorite.getAddedAt()), Collectors.counting()));

        return months.stream()
                .map(month -> new PartnerStatsOverviewResponse.MonthlyTrendPoint(
                        month.format(MONTH_LABEL_FORMATTER),
                        venueCounts.getOrDefault(month, 0L),
                        bookingCounts.getOrDefault(month, 0L),
                        inquiryCounts.getOrDefault(month, 0L),
                        favoriteCounts.getOrDefault(month, 0L)
                ))
                .toList();
    }

    private List<PartnerStatsOverviewResponse.TopVenueStat> buildTopVenueStats(
            List<Venue> venues,
            List<Booking> bookings,
            List<VenueInquiry> inquiries,
            List<UserFavorite> favorites
    ) {
        Map<Long, Long> favoriteCounts = favorites.stream()
                .collect(Collectors.groupingBy(favorite -> favorite.getVenue().getId(), Collectors.counting()));
        Map<Long, Long> inquiryCounts = inquiries.stream()
                .collect(Collectors.groupingBy(inquiry -> inquiry.getVenue().getId(), Collectors.counting()));
        Map<Long, List<Booking>> bookingsByVenueId = bookings.stream()
                .collect(Collectors.groupingBy(booking -> booking.getVenue().getId()));

        return venues.stream()
                .map(venue -> {
                    List<Booking> venueBookings = bookingsByVenueId.getOrDefault(venue.getId(), List.of());
                    long approvedBookings = venueBookings.stream()
                            .filter(booking -> booking.getStatus() == BookingRequestStatus.APPROVED)
                            .count();
                    BigDecimal approvedRevenue = venueBookings.stream()
                            .filter(booking -> booking.getStatus() == BookingRequestStatus.APPROVED)
                            .map(Booking::getTotalEstimatedCost)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return new PartnerStatsOverviewResponse.TopVenueStat(
                            venue.getId(),
                            venue.getName(),
                            venue.getStatus().name(),
                            venue.getBasePricePerGuest(),
                            favoriteCounts.getOrDefault(venue.getId(), 0L),
                            inquiryCounts.getOrDefault(venue.getId(), 0L),
                            venueBookings.size(),
                            approvedBookings,
                            approvedRevenue
                    );
                })
                .sorted(Comparator
                        .comparingLong(PartnerStatsOverviewResponse.TopVenueStat::approvedBookings).reversed()
                        .thenComparing(PartnerStatsOverviewResponse.TopVenueStat::approvedEstimatedRevenue, Comparator.reverseOrder())
                        .thenComparing(Comparator.comparingLong(PartnerStatsOverviewResponse.TopVenueStat::inquiries).reversed())
                )
                .limit(5)
                .toList();
    }

    private List<PartnerStatsOverviewResponse.MonthlyTrendPoint> buildEmptyMonthlyTrends() {
        return rollingMonths().stream()
                .map(month -> new PartnerStatsOverviewResponse.MonthlyTrendPoint(month.format(MONTH_LABEL_FORMATTER), 0, 0, 0, 0))
                .toList();
    }

    private List<YearMonth> rollingMonths() {
        YearMonth now = YearMonth.now();
        List<YearMonth> months = new ArrayList<>();
        for (int index = MONTH_WINDOW - 1; index >= 0; index--) {
            months.add(now.minusMonths(index));
        }
        return months;
    }

    private long countByVenueStatus(List<Venue> venues, VenueStatus status) {
        return venues.stream()
                .filter(venue -> venue.getStatus() == status)
                .count();
    }

    private List<PartnerStatsOverviewResponse.LabeledCount> toLabeledCounts(Map<String, Long> counts) {
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
                .map(entry -> new PartnerStatsOverviewResponse.LabeledCount(entry.getKey(), entry.getValue()))
                .toList();
    }

    private BigDecimal averageBigDecimal(List<BigDecimal> values) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private Integer averageInteger(List<Integer> values) {
        if (values.isEmpty()) {
            return 0;
        }
        long sum = values.stream()
                .mapToLong(Integer::longValue)
                .sum();
        return Math.toIntExact(Math.round((double) sum / values.size()));
    }

    private BigDecimal averageIntegerAsBigDecimal(List<Integer> values) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        long sum = values.stream()
                .mapToLong(Integer::longValue)
                .sum();
        return BigDecimal.valueOf((double) sum / values.size()).setScale(2, RoundingMode.HALF_UP);
    }
}
