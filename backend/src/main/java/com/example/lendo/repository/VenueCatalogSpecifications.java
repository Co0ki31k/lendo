package com.example.lendo.repository;

import com.example.lendo.dto.VenueCatalogFilter;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;
import com.example.lendo.model.VenueStatus;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class VenueCatalogSpecifications {
    private VenueCatalogSpecifications() {
    }

    public static Specification<Venue> approvedCatalogFilter(VenueCatalogFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), VenueStatus.APPROVED));
            predicates.add(cb.isTrue(root.get("verified")));

            if (hasText(filter.search())) {
                String pattern = "%" + filter.search().trim().toLowerCase(Locale.ROOT) + "%";

                Subquery<Long> addressSearch = query.subquery(Long.class);
                var addressRoot = addressSearch.from(VenueAddress.class);
                addressSearch.select(addressRoot.get("venueId"));
                addressSearch.where(
                        cb.equal(addressRoot.get("venueId"), root.get("id")),
                        cb.or(
                                cb.like(cb.lower(addressRoot.get("city")), pattern),
                                cb.like(cb.lower(addressRoot.get("voivodeship")), pattern)
                        )
                );

                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("description"), "")), pattern),
                        cb.exists(addressSearch)
                ));
            }

            if (filter.guestCount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("capacityMin"), filter.guestCount()));
                predicates.add(cb.greaterThanOrEqualTo(root.get("capacityMax"), filter.guestCount()));
            }

            if (filter.minPricePerGuest() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("basePricePerGuest"), filter.minPricePerGuest()));
            }

            if (filter.maxPricePerGuest() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("basePricePerGuest"), filter.maxPricePerGuest()));
            }

            if (hasText(filter.city())) {
                predicates.add(existsAddressField(query, cb, root.get("id"), "city", filter.city()));
            }

            if (hasText(filter.voivodeship())) {
                predicates.add(existsAddressField(query, cb, root.get("id"), "voivodeship", filter.voivodeship()));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static Predicate existsAddressField(
            jakarta.persistence.criteria.CriteriaQuery<?> query,
            jakarta.persistence.criteria.CriteriaBuilder cb,
            jakarta.persistence.criteria.Path<Long> venueIdPath,
            String fieldName,
            String value
    ) {
        Subquery<Long> subquery = query.subquery(Long.class);
        var addressRoot = subquery.from(VenueAddress.class);
        subquery.select(addressRoot.get("venueId"));
        subquery.where(
                cb.equal(addressRoot.get("venueId"), venueIdPath),
                cb.equal(cb.lower(addressRoot.get(fieldName)), value.trim().toLowerCase(Locale.ROOT))
        );
        return cb.exists(subquery);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
