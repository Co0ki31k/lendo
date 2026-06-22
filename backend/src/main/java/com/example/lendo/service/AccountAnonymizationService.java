package com.example.lendo.service;

import com.example.lendo.model.PartnerProfile;
import com.example.lendo.model.User;
import com.example.lendo.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountAnonymizationService {
    private static final String DELETED_EMAIL_DOMAIN = "deleted.local";
    private static final String DELETED_FIRST_NAME = "Deleted";
    private static final String DELETED_LAST_NAME = "User";

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public void anonymizeUser(User user) {
        String normalizedId = user.getId().toString().toLowerCase(Locale.ROOT);

        user.setEmail("deleted-user-" + normalizedId + "@" + DELETED_EMAIL_DOMAIN);
        user.setFirstName(DELETED_FIRST_NAME);
        user.setLastName(DELETED_LAST_NAME);
        user.setPhoneNumber(null);
        user.setAvatarUrl(null);
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setProvider("DELETED");
        user.setActive(false);

        refreshTokenRepository.deleteByUser(user);
    }

    public void anonymizePartnerProfile(PartnerProfile profile) {
        String suffix = profile.getUserId().toString().substring(0, 8).toLowerCase(Locale.ROOT);

        profile.setCompanyName("Deleted partner " + suffix);
        profile.setTaxId(null);
        profile.setContactEmail(null);
        profile.setDescription(null);
        profile.setVerified(false);
    }
}
