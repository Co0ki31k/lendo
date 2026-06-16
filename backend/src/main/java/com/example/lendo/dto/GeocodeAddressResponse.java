package com.example.lendo.dto;

import java.math.BigDecimal;

public record GeocodeAddressResponse(
        BigDecimal latitude,
        BigDecimal longitude,
        String displayName
) {
}
