package com.example.lendo.service;

import com.example.lendo.dto.CreateVenueInquiryRequest;
import com.example.lendo.dto.VenueInquiryResponse;
import com.example.lendo.model.User;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueInquiry;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.repository.VenueInquiryRepository;
import com.example.lendo.repository.VenueRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class VenueInquiryService {
    private final VenueRepository venueRepository;
    private final VenueInquiryRepository venueInquiryRepository;
    private final PartnerVenueService partnerVenueService;

    @Transactional
    public VenueInquiryResponse createInquiry(Long venueId, CreateVenueInquiryRequest request) {
        Venue venue = venueRepository.findByIdAndStatus(venueId, VenueStatus.APPROVED)
                .filter(Venue::isVerified)
                .orElseThrow(() -> new RuntimeException("Obiekt nie istnieje"));

        VenueInquiry inquiry = venueInquiryRepository.save(
                VenueInquiry.builder()
                        .venue(venue)
                        .contactEmail(request.contactEmail().trim())
                        .contactPhone(request.contactPhone() != null && !request.contactPhone().isBlank()
                                ? request.contactPhone().trim()
                                : null)
                        .messageText(request.messageText().trim())
                        .build()
        );

        return VenueInquiryResponse.from(inquiry);
    }

    @Transactional
    public List<VenueInquiryResponse> getVenueInquiries(User user, Long venueId) {
        Venue venue = partnerVenueService.resolveManagedVenueForMessages(user, venueId);

        if (!"ADMIN".equals(user.getRoleName()) && !Objects.equals(venue.getManager().getId(), user.getId())) {
            throw new RuntimeException("Nie masz dostepu do wiadomosci tego obiektu");
        }

        return venueInquiryRepository.findAllByVenueIdOrderByCreatedAtDesc(venue.getId()).stream()
                .map(VenueInquiryResponse::from)
                .toList();
    }
}
