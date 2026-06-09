package com.example.lendo.dto;

import org.springframework.data.domain.Page;

import java.math.BigDecimal;

public record WeddChanceResponse(
        long totalAvailableOffers,
        BigDecimal averageDiscountPercentage,
        Page<WeddChanceOfferResponse> offers
) {
}
