package com.example.lendo.dto;

import java.math.BigDecimal;

public record VenueCatalogFilter(
        String search,
        String city,
        String voivodeship,
        Integer guestCount,
        BigDecimal minPricePerGuest,
        BigDecimal maxPricePerGuest
) {
}
