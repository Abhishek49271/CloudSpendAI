package com.cloudspend.backend.dto;

import java.math.BigDecimal;

public class CostAnalyticsResponse {

    private String name;
    private BigDecimal totalCost;

    public CostAnalyticsResponse() {
    }

    public CostAnalyticsResponse(String name, BigDecimal totalCost) {
        this.name = name;
        this.totalCost = totalCost;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }
}