package com.example.lendo.service;

import com.example.lendo.dto.AdminPartnerListResponse;
import com.example.lendo.dto.AdminVenueResponse;
import com.example.lendo.dto.AdminVenueListResponse;
import com.example.lendo.dto.PageMetadata;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.dto.AdminPartnerProfileResponse;
import com.example.lendo.repository.VenueAddressRepository;
import com.example.lendo.repository.VenueRepository;
import com.example.lendo.model.PartnerProfile;
import com.example.lendo.repository.PartnerProfileRepository;
import com.example.lendo.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminPartnerService {
    private final PartnerProfileRepository partnerProfileRepository;
    private final VenueRepository venueRepository;
    private final VenueAddressRepository venueAddressRepository;
    private final PartnerVenueService partnerVenueService;
    private final UserRepository userRepository;
    private final AccountAnonymizationService accountAnonymizationService;

    @Transactional
    public AdminPartnerListResponse getAllPartnerProfiles(
            int page,
            int size,
            String search,
            Boolean verified,
            String sortBy,
            String sortDir
    ) {
        Specification<PartnerProfile> specification = buildPartnerSpecification(search, verified);
        Pageable pageable = PageRequest.of(
                normalizePage(page),
                normalizeSize(size),
                buildSort(sortBy, sortDir, "createdAt", "companyName", "verified")
        );

        Page<PartnerProfile> partnerPage = partnerProfileRepository.findAll(specification, pageable);

        long total = partnerProfileRepository.count(specification);
        long verifiedCount = partnerProfileRepository.count(specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.isTrue(root.get("verified"))
        ));

        return new AdminPartnerListResponse(
                partnerPage.getContent().stream()
                        .map(AdminPartnerProfileResponse::from)
                        .toList(),
                toMetadata(partnerPage),
                new AdminPartnerListResponse.Summary(total, verifiedCount, total - verifiedCount)
        );
    }

    @Transactional
    public AdminPartnerProfileResponse setVerification(UUID userId, boolean verified) {
        PartnerProfile profile = partnerProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Profil partnera nie istnieje"));

        profile.setVerified(verified);
        return AdminPartnerProfileResponse.from(partnerProfileRepository.save(profile));
    }

    @Transactional
    public void deletePartner(UUID userId) {
        PartnerProfile profile = partnerProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Profil partnera nie istnieje"));

        if (!profile.getUser().isActive()) {
            throw new RuntimeException("To konto partnera zostalo juz usuniete");
        }

        accountAnonymizationService.anonymizePartnerProfile(profile);
        accountAnonymizationService.anonymizeUser(profile.getUser());
        userRepository.save(profile.getUser());
        partnerProfileRepository.save(profile);
    }

    @Transactional
    public AdminVenueListResponse getAllVenues(
            int page,
            int size,
            String search,
            String status,
            String sortBy,
            String sortDir
    ) {
        Specification<Venue> specification = buildVenueSpecification(search, status);
        Pageable pageable = PageRequest.of(
                normalizePage(page),
                normalizeSize(size),
                buildSort(sortBy, sortDir, "createdAt", "name", "status", "basePricePerGuest")
        );

        Page<Venue> venuePage = venueRepository.findAll(specification, pageable);

        long total = venueRepository.count(specification);
        long pendingCount = venueRepository.count(specification.and(hasStatus(VenueStatus.PENDING)));
        long approvedCount = venueRepository.count(specification.and(hasStatus(VenueStatus.APPROVED)));
        long draftCount = venueRepository.count(specification.and(hasStatus(VenueStatus.DRAFT)));
        long rejectedCount = venueRepository.count(specification.and(hasStatus(VenueStatus.REJECTED)));

        return new AdminVenueListResponse(
                venuePage.getContent().stream()
                        .map(this::toAdminVenueResponse)
                        .toList(),
                toMetadata(venuePage),
                new AdminVenueListResponse.Summary(total, pendingCount, approvedCount, draftCount, rejectedCount)
        );
    }

    @Transactional
    public AdminVenueResponse updateVenueStatus(Long venueId, String rawStatus, String comment) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new RuntimeException("Obiekt nie istnieje"));

        VenueStatus status;
        try {
            status = VenueStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Nieobslugiwany status obiektu");
        }

        venue.setStatus(status);
        venue.setVerified(status == VenueStatus.APPROVED);

        if (status == VenueStatus.DRAFT) {
            if (!StringUtils.hasText(comment)) {
                throw new RuntimeException("Dodaj komentarz dla managera przed cofnieciem obiektu do poprawy");
            }

            venue.setAdminReviewComment(comment.trim());
        } else if (status == VenueStatus.APPROVED) {
            venue.setAdminReviewComment(null);
        } else if (StringUtils.hasText(comment)) {
            venue.setAdminReviewComment(comment.trim());
        } else {
            venue.setAdminReviewComment(null);
        }

        return toAdminVenueResponse(venue);
    }

    @Transactional
    public void deleteVenue(Long venueId) {
        partnerVenueService.deleteVenueByAdmin(venueId);
    }

    private AdminVenueResponse toAdminVenueResponse(Venue venue) {
        VenueAddress address = venue.getAddress();
        if (address == null) {
            address = venueAddressRepository.findById(venue.getId())
                    .orElseThrow(() -> new IllegalStateException("Venue address is missing for venue " + venue.getId()));
        }

        return AdminVenueResponse.from(venue, address);
    }

    private Specification<PartnerProfile> buildPartnerSpecification(String search, Boolean verified) {
        Specification<PartnerProfile> specification = (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (verified != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("verified"), verified)
            );
        }

        if (StringUtils.hasText(search)) {
            String normalizedSearch = "%" + search.trim().toLowerCase() + "%";
            specification = specification.and((root, query, criteriaBuilder) -> {
                var user = root.join("user");
                return criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("companyName")), normalizedSearch),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("taxId")), normalizedSearch),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("contactEmail")), normalizedSearch),
                        criteriaBuilder.like(criteriaBuilder.lower(user.get("email")), normalizedSearch),
                        criteriaBuilder.like(criteriaBuilder.lower(user.get("firstName")), normalizedSearch),
                        criteriaBuilder.like(criteriaBuilder.lower(user.get("lastName")), normalizedSearch)
                );
            });
        }

        return specification;
    }

    private Specification<Venue> buildVenueSpecification(String search, String status) {
        Specification<Venue> specification = (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (StringUtils.hasText(status)) {
            VenueStatus venueStatus = parseVenueStatus(status);
            specification = specification.and(hasStatus(venueStatus));
        }

        if (StringUtils.hasText(search)) {
            String normalizedSearch = "%" + search.trim().toLowerCase() + "%";
            specification = specification.and((root, query, criteriaBuilder) -> {
                var manager = root.join("manager");
                var address = root.join("address");
                return criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), normalizedSearch),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("style")), normalizedSearch),
                        criteriaBuilder.like(criteriaBuilder.lower(manager.get("email")), normalizedSearch),
                        criteriaBuilder.like(criteriaBuilder.lower(address.get("city")), normalizedSearch),
                        criteriaBuilder.like(criteriaBuilder.lower(address.get("street")), normalizedSearch),
                        criteriaBuilder.like(criteriaBuilder.lower(address.get("voivodeship")), normalizedSearch)
                );
            });
        }

        return specification;
    }

    private Specification<Venue> hasStatus(VenueStatus status) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("status"), status);
    }

    private VenueStatus parseVenueStatus(String rawStatus) {
        try {
            return VenueStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Nieobslugiwany status obiektu");
        }
    }

    private Sort buildSort(String sortBy, String sortDir, String... allowedFields) {
        String normalizedSortBy = StringUtils.hasText(sortBy) ? sortBy.trim() : "createdAt";
        boolean allowed = List.of(allowedFields).contains(normalizedSortBy);

        if (!allowed) {
            normalizedSortBy = "createdAt";
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, normalizedSortBy);
    }

    private PageMetadata toMetadata(Page<?> page) {
        return new PageMetadata(
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.hasNext(),
                page.hasPrevious()
        );
    }

    private int normalizePage(int page) {
        return Math.max(page, 0);
    }

    private int normalizeSize(int size) {
        return Math.max(1, Math.min(size, 50));
    }
}
