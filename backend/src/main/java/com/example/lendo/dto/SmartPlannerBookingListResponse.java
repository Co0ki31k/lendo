package com.example.lendo.dto;

import java.util.List;

public record SmartPlannerBookingListResponse(
        List<SmartPlannerBookingResponse> items,
        Summary summary
) {
    public record Summary(
            long total,
            long submitted,
            long approved,
            long changeRequested,
            long cancellationRequested,
            long rejected,
            long expired,
            long cancelled
    ) {
    }
}
