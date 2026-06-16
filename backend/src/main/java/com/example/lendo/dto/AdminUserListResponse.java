package com.example.lendo.dto;

import java.util.List;

public record AdminUserListResponse(
        List<AdminUserResponse> items,
        PageMetadata page,
        Summary summary
) {
    public record Summary(
            long total,
            long users,
            long admins
    ) {
    }
}
