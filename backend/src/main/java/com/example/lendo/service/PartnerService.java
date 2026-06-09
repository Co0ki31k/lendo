package com.example.lendo.service;

import com.example.lendo.dto.PartnerProfileResponse;
import com.example.lendo.dto.PartnerProfileUpsertRequest;
import com.example.lendo.model.PartnerProfile;
import com.example.lendo.model.Role;
import com.example.lendo.model.User;
import com.example.lendo.repository.PartnerProfileRepository;
import com.example.lendo.repository.RoleRepository;
import com.example.lendo.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PartnerService {
    private final PartnerProfileRepository partnerProfileRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    @Transactional
    public PartnerProfileResponse upsertProfile(User user, PartnerProfileUpsertRequest request) {
        PartnerProfile profile = partnerProfileRepository.findById(user.getId())
                .orElseGet(() -> PartnerProfile.builder().user(user).build());

        profile.setCompanyName(request.companyName());
        profile.setTaxId(request.taxId());
        profile.setContactEmail(request.contactEmail());
        profile.setDescription(request.description());

        PartnerProfile savedProfile = partnerProfileRepository.save(profile);
        ensureManagerRole(user);
        return PartnerProfileResponse.from(savedProfile);
    }

    @Transactional
    public PartnerProfileResponse getProfile(User user) {
        PartnerProfile profile = partnerProfileRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Profil partnera nie istnieje"));
        return PartnerProfileResponse.from(profile);
    }

    private void ensureManagerRole(User user) {
        if ("MANAGER".equals(user.getRoleName()) || "ADMIN".equals(user.getRoleName())) {
            return;
        }

        Role managerRole = roleRepository.findByName("MANAGER")
                .orElseThrow(() -> new IllegalStateException("Role MANAGER is missing"));

        user.setRole(managerRole);
        userRepository.save(user);
    }
}
