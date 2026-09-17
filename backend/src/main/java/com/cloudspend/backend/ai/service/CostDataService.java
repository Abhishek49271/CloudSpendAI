package com.cloudspend.backend.ai.service;

import com.cloudspend.backend.repository.CostRecordRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CostDataService {

    private final CostRecordRepository costRecordRepository;

    public CostDataService(CostRecordRepository costRecordRepository) {
        this.costRecordRepository = costRecordRepository;
    }

    public BigDecimal getTotalCost() {
        return costRecordRepository.getTotalCost();
    }

    public long getRecordCount() {
        return costRecordRepository.count();
    }

    public List<Object[]> getDailyCost() {
        return costRecordRepository.getDailyCost();
    }

    public List<Object[]> getCostByService() {
        return costRecordRepository.getCostByService();
    }

    public List<Object[]> getCostByRegion() {
        return costRecordRepository.getCostByRegion();
    }

    public List<Object[]> getCostByDepartment() {
        return costRecordRepository.getCostByDepartment();
    }

    public List<Object[]> getCostByEnvironment() {
        return costRecordRepository.getCostByEnvironment();
    }

    public List<Object[]> getCostByResource() {
        return costRecordRepository.getCostByResource();
    }

    public List<Object[]> getCostByResourceGroup() {
        return costRecordRepository.getCostByResourceGroup();
    }
}
