package com.example.lendo.service;

import com.example.lendo.dto.WeddChanceOfferResponse;
import com.example.lendo.dto.WeddChanceResponse;
import com.example.lendo.model.VenueAddress;
import com.example.lendo.model.VenueImage;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.model.WeddDeal;
import com.example.lendo.repository.VenueAddressRepository;
import com.example.lendo.repository.VenueImageRepository;
import com.example.lendo.repository.WeddDealRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WeddChanceService {
    private final WeddDealRepository weddDealRepository;
    private final VenueAddressRepository venueAddressRepository;
    private final VenueImageRepository venueImageRepository;

    @Transactional
    public WeddChanceResponse getAvailableOffers(Pageable pageable) {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        Page<WeddDeal> dealsPage = weddDealRepository.findAvailableWeddDeals(
                today,
                now,
                VenueStatus.APPROVED,
                pageable
        );

        List<Long> venueIds = dealsPage.getContent().stream()
                .map(deal -> deal.getVenue().getId())
                .distinct()
                .toList();

        Map<Long, VenueAddress> addressesByVenueId = venueAddressRepository.findAllByVenueIdIn(venueIds).stream()
                .collect(Collectors.toMap(VenueAddress::getVenueId, Function.identity()));

        Map<Long, VenueImage> primaryImagesByVenueId = venueImageRepository.findByVenueIdInAndPrimaryImageTrue(venueIds).stream()
                .collect(Collectors.toMap(image -> image.getVenue().getId(), Function.identity()));

        Page<WeddChanceOfferResponse> offers = dealsPage.map(deal -> WeddChanceOfferResponse.from(
                deal,
                addressesByVenueId.get(deal.getVenue().getId()),
                primaryImagesByVenueId.get(deal.getVenue().getId())
        ));

        long totalAvailableOffers = weddDealRepository.countAvailableWeddDeals(today, now, VenueStatus.APPROVED);
        Double averageDiscount = weddDealRepository.averageDiscountPercentageForAvailableWeddDeals(today, now, VenueStatus.APPROVED);

        return new WeddChanceResponse(
                totalAvailableOffers,
                averageDiscount != null
                        ? BigDecimal.valueOf(averageDiscount).setScale(2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                offers
        );
    }
}
