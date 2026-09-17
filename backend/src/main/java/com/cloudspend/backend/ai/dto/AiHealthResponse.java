package com.cloudspend.backend.ai.dto;

public record AiHealthResponse(
        String provider,
        String model,
        boolean available,
        String message
) {}
