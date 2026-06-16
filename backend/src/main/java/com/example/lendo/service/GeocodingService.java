package com.example.lendo.service;

import com.example.lendo.dto.GeocodeAddressRequest;
import com.example.lendo.dto.GeocodeAddressResponse;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

@Service
@Slf4j
public class GeocodingService {
    private final RestClient restClient;
    private final String nominatimSearchUrl;
    private final String contactEmail;

    public GeocodingService(
            @Value("${app.geocoding.nominatim-url}") String nominatimSearchUrl,
            @Value("${app.geocoding.user-agent}") String userAgent,
            @Value("${app.geocoding.email:}") String contactEmail
    ) {
        this.nominatimSearchUrl = nominatimSearchUrl;
        this.contactEmail = contactEmail;
        this.restClient = RestClient.builder()
                .defaultHeader(HttpHeaders.USER_AGENT, userAgent)
                .defaultHeader(HttpHeaders.ACCEPT_LANGUAGE, "pl")
                .build();
    }

    public GeocodeAddressResponse geocodeAddress(GeocodeAddressRequest request) {
        URI uri = UriComponentsBuilder.fromUriString(nominatimSearchUrl)
                .queryParam("street", request.street())
                .queryParam("city", request.city())
                .queryParam("state", request.voivodeship())
                .queryParam("postalcode", request.postalCode())
                .queryParam("country", "Poland")
                .queryParam("countrycodes", "pl")
                .queryParam("format", "jsonv2")
                .queryParam("limit", 1)
                .queryParam("addressdetails", 1)
                .queryParam("accept-language", "pl")
                .queryParamIfPresent("email", StringUtils.hasText(contactEmail) ? java.util.Optional.of(contactEmail) : java.util.Optional.empty())
                .build(true)
                .toUri();

        List<NominatimSearchItem> results = restClient.get()
                .uri(uri)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});

        if (results == null || results.isEmpty()) {
            throw new RuntimeException("Nie znaleziono wspolrzednych dla podanego adresu");
        }

        NominatimSearchItem bestMatch = results.getFirst();

        try {
            return new GeocodeAddressResponse(
                    new BigDecimal(bestMatch.lat()),
                    new BigDecimal(bestMatch.lon()),
                    bestMatch.displayName()
            );
        } catch (NumberFormatException exception) {
            log.warn("Nominatim zwrocil nieprawidlowe wspolrzedne dla adresu {}", request, exception);
            throw new RuntimeException("Nie udalo sie odczytac wspolrzednych dla podanego adresu");
        }
    }

    private record NominatimSearchItem(
            String lat,
            String lon,
            @JsonProperty("display_name")
            String displayName
    ) {
    }
}
