package com.example.lendo.service;

import com.example.lendo.model.PartnerProfile;
import com.example.lendo.model.User;
import com.example.lendo.repository.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountAnonymizationServiceTest {
    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AccountAnonymizationService accountAnonymizationService;

    @Test
    void shouldAnonymizeUserAndDisableLogin() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email("jan@example.com")
                .firstName("Jan")
                .lastName("Kowalski")
                .phoneNumber("123456789")
                .avatarUrl("https://example.com/avatar.jpg")
                .passwordHash("old-hash")
                .provider("LOCAL")
                .isActive(true)
                .build();
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-placeholder");

        accountAnonymizationService.anonymizeUser(user);

        assertEquals("deleted-user-" + userId.toString().toLowerCase() + "@deleted.local", user.getEmail());
        assertEquals("Deleted", user.getFirstName());
        assertEquals("User", user.getLastName());
        assertNull(user.getPhoneNumber());
        assertNull(user.getAvatarUrl());
        assertEquals("encoded-placeholder", user.getPasswordHash());
        assertEquals("DELETED", user.getProvider());
        assertFalse(user.isActive());
        verify(refreshTokenRepository).deleteByUser(user);
    }

    @Test
    void shouldAnonymizePartnerProfile() {
        UUID userId = UUID.randomUUID();
        PartnerProfile profile = PartnerProfile.builder()
                .userId(userId)
                .companyName("Sala Perla")
                .taxId("1234567890")
                .contactEmail("kontakt@perla.pl")
                .description("Opis")
                .verified(true)
                .build();

        accountAnonymizationService.anonymizePartnerProfile(profile);

        assertTrue(profile.getCompanyName().startsWith("Deleted partner "));
        assertNull(profile.getTaxId());
        assertNull(profile.getContactEmail());
        assertNull(profile.getDescription());
        assertFalse(profile.isVerified());
    }
}
