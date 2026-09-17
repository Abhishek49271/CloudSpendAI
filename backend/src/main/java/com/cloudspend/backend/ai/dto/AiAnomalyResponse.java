package com.cloudspend.backend.ai.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AiAnomalyResponse(
        LocalDate date,
        BigDecimal cost,
        BigDecimal zScore,
        String severity
) {}
