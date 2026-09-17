package com.cloudspend.backend.service;

import com.cloudspend.backend.dto.CostAnalyticsResponse;
import com.cloudspend.backend.entity.CostRecord;
import com.cloudspend.backend.repository.CostRecordRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CostRecordService {

    private final CostRecordRepository repository;

    public CostRecordService(CostRecordRepository repository) {
        this.repository = repository;
    }
    public List<CostRecord> getAllCosts() {
        return repository.findAll();
    }

    public CostRecord createCost(CostRecord costRecord) {
        return repository.save(costRecord);
    }

    public BigDecimal getTotalCost() {
        return repository.getTotalCost();
    }

    public List<CostAnalyticsResponse> getDailyCost() {
        return convertToAnalyticsResponse(repository.getDailyCost());
    }

    public List<CostAnalyticsResponse> getCostByService() {
        return convertToAnalyticsResponse(repository.getCostByService());
    }

    public List<CostAnalyticsResponse> getCostByRegion() {
        return convertToAnalyticsResponse(repository.getCostByRegion());
    }

    public List<CostAnalyticsResponse> getCostByDepartment() {
        return convertToAnalyticsResponse(repository.getCostByDepartment());
    }

    public List<CostAnalyticsResponse> getCostByEnvironment() {
        return convertToAnalyticsResponse(repository.getCostByEnvironment());
    }

    private List<CostAnalyticsResponse> convertToAnalyticsResponse(
            List<Object[]> results) {

        return results.stream()
                .map(row -> new CostAnalyticsResponse(
                        String.valueOf(row[0]),
                        (BigDecimal) row[1]
                ))
                .toList();
    }
}