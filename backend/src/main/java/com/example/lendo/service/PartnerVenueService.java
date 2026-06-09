package com.example.lendo.service;

import com.example.lendo.dto.CreateVenueRequest;
import com.example.lendo.dto.SetPrimaryVenueImageRequest;
import com.example.lendo.dto.UpdateVenueRequest;
import com.example.lendo.dto.UpdateVenueImageOrderRequest;
import com.example.lendo.dto.VenueImageUploadResult;
import com.example.lendo.dto.VenueImageResponse;
import com.example.lendo.dto.VenueResponse;
import com.example.lendo.model.User;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueAddress;
import com.example.lendo.model.VenueImage;
import com.example.lendo.model.VenueStatus;
import com.example.lendo.repository.PartnerProfileRepository;
import com.example.lendo.repository.VenueAddressRepository;
import com.example.lendo.repository.VenueImageRepository;
import com.example.lendo.repository.VenueRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PartnerVenueService {
    private final VenueRepository venueRepository;
    private final VenueAddressRepository venueAddressRepository;
    private final VenueImageRepository venueImageRepository;
    private final PartnerProfileRepository partnerProfileRepository;
    private final CloudinaryVenueImageService cloudinaryVenueImageService;

    @Transactional
    public VenueResponse createVenue(User user, CreateVenueRequest request) {
        requireVerifiedPartnerProfile(user);
        validateVenuePayload(
                request.capacityMin(),
                request.capacityMax(),
                request.hasAccommodation(),
                request.accommodationPlaces()
        );

        Venue venue = venueRepository.save(
                Venue.builder()
                        .manager(user)
                        .name(request.name())
                        .description(request.description())
                        .style(request.style())
                        .capacityMin(request.capacityMin())
                        .capacityMax(request.capacityMax())
                        .hasAccommodation(request.hasAccommodation())
                        .accommodationPlaces(request.accommodationPlaces())
                        .basePricePerGuest(request.basePricePerGuest())
                        .noCorkageFee(request.noCorkageFee())
                        .civilWeddingGarden(request.civilWeddingGarden())
                        .verified(false)
                        .status(VenueStatus.DRAFT)
                        .build()
        );

        VenueAddress address = venueAddressRepository.save(
                VenueAddress.builder()
                        .venue(venue)
                        .street(request.street())
                        .city(request.city())
                        .postalCode(request.postalCode())
                        .voivodeship(request.voivodeship())
                        .latitude(request.latitude())
                        .longitude(request.longitude())
                        .build()
        );

        return VenueResponse.from(venue, address);
    }

    @Transactional
    public VenueResponse getVenue(User user, Long venueId) {
        Venue venue = resolveManagedVenue(user, venueId);
        VenueAddress address = venueAddressRepository.findById(venue.getId())
                .orElseThrow(() -> new IllegalStateException("Venue address is missing for venue " + venue.getId()));
        return VenueResponse.from(venue, address);
    }

    @Transactional
    public VenueResponse updateVenue(User user, Long venueId, UpdateVenueRequest request) {
        Venue venue = resolveManagedVenue(user, venueId);
        VenueAddress address = venueAddressRepository.findById(venue.getId())
                .orElseThrow(() -> new IllegalStateException("Venue address is missing for venue " + venue.getId()));

        validateVenuePayload(
                request.capacityMin(),
                request.capacityMax(),
                request.hasAccommodation(),
                request.accommodationPlaces()
        );

        venue.setName(request.name());
        venue.setDescription(request.description());
        venue.setStyle(request.style());
        venue.setCapacityMin(request.capacityMin());
        venue.setCapacityMax(request.capacityMax());
        venue.setHasAccommodation(request.hasAccommodation());
        venue.setAccommodationPlaces(request.accommodationPlaces());
        venue.setBasePricePerGuest(request.basePricePerGuest());
        venue.setNoCorkageFee(request.noCorkageFee());
        venue.setCivilWeddingGarden(request.civilWeddingGarden());

        address.setStreet(request.street());
        address.setCity(request.city());
        address.setPostalCode(request.postalCode());
        address.setVoivodeship(request.voivodeship());
        address.setLatitude(request.latitude());
        address.setLongitude(request.longitude());

        if (venue.getStatus() == VenueStatus.APPROVED) {
            venue.setStatus(VenueStatus.PENDING);
            venue.setVerified(false);
        }

        return VenueResponse.from(venue, address);
    }

    @Transactional
    public VenueResponse submitVenueForReview(User user, Long venueId) {
        Venue venue = resolveManagedVenue(user, venueId);
        VenueAddress address = venueAddressRepository.findById(venue.getId())
                .orElseThrow(() -> new IllegalStateException("Venue address is missing for venue " + venue.getId()));

        if (venue.getStatus() == VenueStatus.APPROVED) {
            throw new RuntimeException("Obiekt jest juz zatwierdzony");
        }

        if (venueImageRepository.findByVenueIdOrderByDisplayOrderAscIdAsc(venue.getId()).isEmpty()) {
            throw new RuntimeException("Dodaj przynajmniej jedno zdjecie przed wyslaniem obiektu do akceptacji");
        }

        venue.setStatus(VenueStatus.PENDING);
        venue.setVerified(false);

        return VenueResponse.from(venue, address);
    }

    @Transactional
    public VenueImageResponse uploadVenueImage(
            User user,
            Long venueId,
            MultipartFile file,
            Integer displayOrder,
            Boolean primaryImage
    ) {
        Venue venue = resolveManagedVenue(user, venueId);
        validateUploadFile(file);

        VenueImageUploadResult uploadResult = cloudinaryVenueImageService.uploadVenueImage(file, venueId);

        return persistVenueImage(
                venue,
                uploadResult.imageUrl(),
                uploadResult.cloudinaryPublicId(),
                displayOrder,
                primaryImage
        );
    }

    @Transactional
    public List<VenueImageResponse> getVenueImages(User user, Long venueId) {
        Venue venue = resolveManagedVenue(user, venueId);
        return venueImageRepository.findByVenueIdOrderByDisplayOrderAscIdAsc(venue.getId()).stream()
                .map(VenueImageResponse::from)
                .toList();
    }

    @Transactional
    public void deleteVenueImage(User user, Long venueId, Long imageId) {
        Venue venue = resolveManagedVenue(user, venueId);
        VenueImage image = venueImageRepository.findByIdAndVenueId(imageId, venue.getId())
                .orElseThrow(() -> new RuntimeException("Zdjecie nie istnieje"));

        boolean wasPrimary = image.isPrimaryImage();
        String cloudinaryPublicId = image.getCloudinaryPublicId();

        venueImageRepository.delete(image);

        List<VenueImage> remainingImages = venueImageRepository.findByVenueIdOrderByDisplayOrderAscIdAsc(venue.getId());
        if (wasPrimary && !remainingImages.isEmpty()) {
            remainingImages.getFirst().setPrimaryImage(true);
        }

        cloudinaryVenueImageService.deleteVenueImage(cloudinaryPublicId);
    }

    @Transactional
    public VenueImageResponse setPrimaryVenueImage(
            User user,
            Long venueId,
            Long imageId,
            SetPrimaryVenueImageRequest request
    ) {
        Venue venue = resolveManagedVenue(user, venueId);
        VenueImage image = venueImageRepository.findByIdAndVenueId(imageId, venue.getId())
                .orElseThrow(() -> new RuntimeException("Zdjecie nie istnieje"));

        if (!Boolean.TRUE.equals(request.primaryImage())) {
            throw new RuntimeException("Zdjecie glowne moze byc ustawione tylko na true");
        }

        List<VenueImage> existingImages = venueImageRepository.findByVenueIdOrderByDisplayOrderAscIdAsc(venue.getId());
        clearPrimaryImageFlag(existingImages);
        image.setPrimaryImage(true);

        return VenueImageResponse.from(image);
    }

    @Transactional
    public List<VenueImageResponse> updateVenueImageOrder(
            User user,
            Long venueId,
            UpdateVenueImageOrderRequest request
    ) {
        Venue venue = resolveManagedVenue(user, venueId);
        List<VenueImage> existingImages = venueImageRepository.findByVenueIdOrderByDisplayOrderAscIdAsc(venue.getId());
        Map<Long, VenueImage> imagesById = existingImages.stream()
                .collect(Collectors.toMap(VenueImage::getId, image -> image));

        Set<Long> requestedIds = request.items().stream()
                .map(UpdateVenueImageOrderRequest.Item::imageId)
                .collect(Collectors.toSet());

        if (requestedIds.size() != request.items().size()) {
            throw new RuntimeException("Lista zdjec zawiera duplikaty");
        }

        if (requestedIds.size() != existingImages.size() || !imagesById.keySet().equals(requestedIds)) {
            throw new RuntimeException("Musisz przeslac kolejnosc dla wszystkich zdjec obiektu");
        }

        Set<Integer> requestedOrders = request.items().stream()
                .map(UpdateVenueImageOrderRequest.Item::displayOrder)
                .collect(Collectors.toSet());

        if (requestedOrders.size() != request.items().size()) {
            throw new RuntimeException("Display order musi byc unikalny dla kazdego zdjecia");
        }

        for (UpdateVenueImageOrderRequest.Item item : request.items()) {
            VenueImage image = imagesById.get(item.imageId());
            image.setDisplayOrder(item.displayOrder());
        }

        return venueImageRepository.findByVenueIdOrderByDisplayOrderAscIdAsc(venue.getId()).stream()
                .map(VenueImageResponse::from)
                .toList();
    }

    @Transactional
    public List<VenueResponse> getOwnVenues(User user) {
        requirePartnerProfile(user);
        return venueRepository.findAllByManagerIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(venue -> VenueResponse.from(
                        venue,
                        venueAddressRepository.findById(venue.getId())
                                .orElseThrow(() -> new IllegalStateException("Venue address is missing for venue " + venue.getId()))
                ))
                .toList();
    }

    private void requirePartnerProfile(User user) {
        if (!partnerProfileRepository.existsById(user.getId())) {
            throw new RuntimeException("Najpierw uzupelnij profil partnera");
        }
    }

    private void requireVerifiedPartnerProfile(User user) {
        var profile = partnerProfileRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Najpierw uzupelnij profil partnera"));

        if (!profile.isVerified()) {
            throw new RuntimeException("Profil partnera czeka na zatwierdzenie przez administratora");
        }
    }

    private Venue resolveManagedVenue(User user, Long venueId) {
        if (!"ADMIN".equals(user.getRoleName())) {
            requireVerifiedPartnerProfile(user);
        }

        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new RuntimeException("Obiekt nie istnieje"));

        if (!"ADMIN".equals(user.getRoleName()) && !Objects.equals(venue.getManager().getId(), user.getId())) {
            throw new RuntimeException("Nie masz dostepu do tego obiektu");
        }

        return venue;
    }

    private void validateVenuePayload(
            Integer capacityMin,
            Integer capacityMax,
            Boolean hasAccommodation,
            Integer accommodationPlaces
    ) {
        if (capacityMax < capacityMin) {
            throw new RuntimeException("Maksymalna pojemnosc nie moze byc mniejsza od minimalnej");
        }

        if (accommodationPlaces < 0) {
            throw new RuntimeException("Liczba miejsc noclegowych nie moze byc ujemna");
        }

        if (!hasAccommodation && accommodationPlaces > 0) {
            throw new RuntimeException("Obiekt bez noclegu nie moze miec dodatniej liczby miejsc noclegowych");
        }
    }

    private VenueImageResponse persistVenueImage(
            Venue venue,
            String imageUrl,
            String cloudinaryPublicId,
            Integer requestedDisplayOrder,
            Boolean requestedPrimaryImage
    ) {
        List<VenueImage> existingImages = venueImageRepository.findByVenueIdOrderByDisplayOrderAscIdAsc(venue.getId());

        boolean shouldBePrimary = Boolean.TRUE.equals(requestedPrimaryImage) || existingImages.isEmpty();
        int displayOrder = resolveDisplayOrder(existingImages, requestedDisplayOrder);

        if (shouldBePrimary) {
            clearPrimaryImageFlag(existingImages);
        }

        VenueImage image = venueImageRepository.save(
                VenueImage.builder()
                        .venue(venue)
                        .imageUrl(imageUrl)
                        .cloudinaryPublicId(cloudinaryPublicId)
                        .displayOrder(displayOrder)
                        .primaryImage(shouldBePrimary)
                        .build()
        );

        return VenueImageResponse.from(image);
    }

    private int resolveDisplayOrder(List<VenueImage> existingImages, Integer requestedDisplayOrder) {
        if (requestedDisplayOrder != null) {
            if (requestedDisplayOrder < 0) {
                throw new RuntimeException("Display order nie moze byc ujemny");
            }
            return requestedDisplayOrder;
        }

        return existingImages.stream()
                .map(VenueImage::getDisplayOrder)
                .max(Integer::compareTo)
                .orElse(-1) + 1;
    }

    private void clearPrimaryImageFlag(List<VenueImage> existingImages) {
        for (VenueImage existingImage : existingImages) {
            if (existingImage.isPrimaryImage()) {
                existingImage.setPrimaryImage(false);
            }
        }
    }

    private void validateUploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Plik obrazka jest wymagany");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Przesylany plik musi byc obrazkiem");
        }
    }
}
