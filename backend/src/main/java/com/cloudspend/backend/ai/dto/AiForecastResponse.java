package com.cloudspend.backend.ai.dto;

import java.math.BigDecimal;
import java.util.List;

public record AiForecastResponse(
        String method,
        BigDecimal averageDailyCost,
        BigDecimal trendPerDay,
        List<AiForecastPoint> forecast
) {}
