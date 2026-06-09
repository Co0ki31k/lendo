package com.example.lendo.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.lendo.dto.VenueImageUploadResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryVenueImageService {
    private final Cloudinary cloudinary;

    public VenueImageUploadResult uploadVenueImage(MultipartFile file, Long venueId) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "venues/" + venueId,
                            "resource_type", "image"
                    )
            );

            return new VenueImageUploadResult(
                    (String) result.get("secure_url"),
                    (String) result.get("public_id")
            );
        } catch (IOException ex) {
            throw new RuntimeException("Nie udalo sie przeslac obrazka do Cloudinary", ex);
        }
    }

    public void deleteVenueImage(String cloudinaryPublicId) {
        if (cloudinaryPublicId == null || cloudinaryPublicId.isBlank()) {
            return;
        }

        try {
            cloudinary.uploader().destroy(
                    cloudinaryPublicId,
                    ObjectUtils.asMap("resource_type", "image")
            );
        } catch (IOException ex) {
            throw new RuntimeException("Nie udalo sie usunac obrazka z Cloudinary", ex);
        }
    }
}
