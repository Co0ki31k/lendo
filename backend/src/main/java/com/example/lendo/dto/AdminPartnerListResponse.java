package com.example.lendo.dto;

import java.util.List;

public record AdminPartnerListResponse(
        List<AdminPartnerProfileResponse> items,
        PageMetadata page,
        Summary summary
) {
    public record Summary(
            long total,
            long verified,
            long pending
    ) {
    }
}
