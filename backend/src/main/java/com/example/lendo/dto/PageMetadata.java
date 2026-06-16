package com.example.lendo.dto;

public record PageMetadata(
        int page,
        int size,
        long totalItems,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {
}
