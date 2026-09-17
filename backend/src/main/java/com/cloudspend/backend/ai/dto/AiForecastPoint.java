package com.cloudspend.backend.ai.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AiForecastPoint(LocalDate date, BigDecimal forecastCost) {}
