package com.example.lendo.dto;

import java.util.List;

public record PartnerVenueListResponse(
        List<VenueResponse> items,
        PageMetadata page,
        Summary summary
) {
    public record Summary(
            long total,
            long pending,
            long approved,
            long draft,
            long rejected
    ) {
    }
}
