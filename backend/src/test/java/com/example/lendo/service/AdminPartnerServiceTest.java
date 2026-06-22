package com.example.lendo.service;

import com.example.lendo.model.PartnerProfile;
import com.example.lendo.model.Role;
import com.example.lendo.model.User;
import com.example.lendo.repository.PartnerProfileRepository;
import com.example.lendo.repository.UserRepository;
import com.example.lendo.repository.VenueAddressRepository;
import com.example.lendo.repository.VenueRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminPartnerServiceTest {
    @Mock
    private PartnerProfileRepository partnerProfileRepository;

    @Mock
    private VenueRepository venueRepository;

    @Mock
    private VenueAddressRepository venueAddressRepository;

    @Mock
    private PartnerVenueService partnerVenueService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccountAnonymizationService accountAnonymizationService;

    @InjectMocks
    private AdminPartnerService adminPartnerService;

    @Test
    void shouldAnonymizePartnerInsteadOfDeletingProfileAndVenues() {
        User manager = User.builder()
                .id(UUID.randomUUID())
                .email("manager@example.com")
                .role(Role.builder().name("MANAGER").build())
                .isActive(true)
                .build();
        PartnerProfile profile = PartnerProfile.builder()
                .userId(manager.getId())
                .user(manager)
                .companyName("Sala Perla")
                .verified(true)
                .build();

        when(partnerProfileRepository.findById(manager.getId())).thenReturn(Optional.of(profile));

        adminPartnerService.deletePartner(manager.getId());

        verify(accountAnonymizationService).anonymizePartnerProfile(profile);
        verify(accountAnonymizationService).anonymizeUser(manager);
        verify(userRepository).save(manager);
        verify(partnerProfileRepository).save(profile);
        verify(partnerVenueService, never()).deleteVenueByAdmin(any());
    }

    @Test
    void shouldRejectDeletingAlreadyInactivePartner() {
        User manager = User.builder()
                .id(UUID.randomUUID())
                .email("deleted@example.com")
                .role(Role.builder().name("MANAGER").build())
                .isActive(false)
                .build();
        PartnerProfile profile = PartnerProfile.builder()
                .userId(manager.getId())
                .user(manager)
                .companyName("Deleted partner")
                .build();

        when(partnerProfileRepository.findById(manager.getId())).thenReturn(Optional.of(profile));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> adminPartnerService.deletePartner(manager.getId())
        );

        assertEquals("To konto partnera zostalo juz usuniete", exception.getMessage());
        verify(accountAnonymizationService, never()).anonymizePartnerProfile(any());
        verify(accountAnonymizationService, never()).anonymizeUser(any());
        verify(userRepository, never()).save(any());
        verify(partnerProfileRepository, never()).save(any());
    }
}
