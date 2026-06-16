package com.example.lendo.service;

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
import java.util.Optional;

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

    public Coordinates geocodeAddress(String street, String city, String postalCode, String voivodeship) {
        URI uri = UriComponentsBuilder.fromUriString(nominatimSearchUrl)
                .queryParam("street", street)
                .queryParam("city", city)
                .queryParam("state", voivodeship)
                .queryParam("postalcode", postalCode)
                .queryParam("country", "Poland")
                .queryParam("countrycodes", "pl")
                .queryParam("format", "jsonv2")
                .queryParam("limit", 1)
                .queryParam("addressdetails", 1)
                .queryParam("accept-language", "pl")
                .queryParamIfPresent("email", StringUtils.hasText(contactEmail) ? Optional.of(contactEmail) : Optional.empty())
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
            return new Coordinates(
                    new BigDecimal(bestMatch.lat()),
                    new BigDecimal(bestMatch.lon())
            );
        } catch (NumberFormatException exception) {
            log.warn("Nominatim zwrocil nieprawidlowe wspolrzedne dla adresu {}, {}, {}, {}", street, city, postalCode, voivodeship, exception);
            throw new RuntimeException("Nie udalo sie odczytac wspolrzednych dla podanego adresu");
        }
    }

    public record Coordinates(
            BigDecimal latitude,
            BigDecimal longitude
    ) {
    }

    private record NominatimSearchItem(
            String lat,
            String lon,
            @JsonProperty("display_name")
            String displayName
    ) {
    }
}
