package com.example.lendo.dto;

import java.math.BigDecimal;
import java.util.List;

public record PartnerStatsOverviewResponse(
        OverviewKpi kpi,
        VenueStats venues,
        BookingStats bookings,
        DemandStats demand,
        WeddChanceStats weddChance,
        List<MonthlyTrendPoint> monthlyTrends,
        List<TopVenueStat> topVenues
) {
    public record OverviewKpi(
            long totalVenues,
            long approvedVenues,
            long activeBookings,
            long approvedBookings,
            BigDecimal approvedEstimatedRevenue,
            long totalInquiries,
            long totalFavorites,
            long activeWeddDeals
    ) {
    }

    public record VenueStats(
            long total,
            long approved,
            long pending,
            long draft,
            long rejected,
            BigDecimal averagePricePerGuest,
            Integer averageCapacityMin,
            Integer averageCapacityMax,
            long withAccommodation,
            long withCivilWeddingGarden,
            List<LabeledCount> byStyle,
            List<LabeledCount> byVoivodeship
    ) {
    }

    public record BookingStats(
            long total,
            long submitted,
            long approved,
            long changeRequested,
            long cancellationRequested,
            long rejected,
            long expired,
            long cancelled,
            Integer averageGuests,
            BigDecimal averagePricePerGuest,
            BigDecimal totalEstimatedRevenue,
            BigDecimal approvedEstimatedRevenue,
            Long averageDecisionHours,
            long fullServiceCount,
            long withoutFullServiceCount,
            DietTotals dietTotals
    ) {
    }

    public record DietTotals(
            long standard,
            long vegetarian,
            long vegan,
            long glutenFree
    ) {
    }

    public record DemandStats(
            long totalInquiries,
            long totalFavorites
    ) {
    }

    public record WeddChanceStats(
            long activeDeals,
            BigDecimal averageDiscountPercentage,
            BigDecimal averageSpecialPricePerGuest,
            long totalBookings,
            BigDecimal totalEstimatedRevenue
    ) {
    }

    public record MonthlyTrendPoint(
            String month,
            long venueCount,
            long bookingCount,
            long inquiryCount,
            long favoriteCount
    ) {
    }

    public record TopVenueStat(
            Long venueId,
            String venueName,
            String status,
            BigDecimal basePricePerGuest,
            long favorites,
            long inquiries,
            long bookings,
            long approvedBookings,
            BigDecimal approvedEstimatedRevenue
    ) {
    }

    public record LabeledCount(
            String label,
            long count
    ) {
    }
}
