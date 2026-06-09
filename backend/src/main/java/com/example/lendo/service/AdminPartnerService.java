package com.example.lendo.service;

import com.example.lendo.dto.AdminPartnerProfileResponse;
import com.example.lendo.model.PartnerProfile;
import com.example.lendo.repository.PartnerProfileRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminPartnerService {
    private final PartnerProfileRepository partnerProfileRepository;

    @Transactional
    public List<AdminPartnerProfileResponse> getAllPartnerProfiles() {
        return partnerProfileRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AdminPartnerProfileResponse::from)
                .toList();
    }

    @Transactional
    public AdminPartnerProfileResponse setVerification(UUID userId, boolean verified) {
        PartnerProfile profile = partnerProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Profil partnera nie istnieje"));

        profile.setVerified(verified);
        return AdminPartnerProfileResponse.from(partnerProfileRepository.save(profile));
    }
}
