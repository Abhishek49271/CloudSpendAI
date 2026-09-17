package com.cloudspend.backend.ai.dto;

import java.util.List;

public record AiInsightResponse(
        String summary,
        List<String> highlights,
        List<String> recommendations,
        List<String> anomalies
) {}
