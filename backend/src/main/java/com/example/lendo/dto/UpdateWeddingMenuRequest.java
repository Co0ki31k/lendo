package com.example.lendo.dto;

import java.util.List;

public record UpdateWeddingMenuRequest(
        List<Long> dishIds
) {
}
