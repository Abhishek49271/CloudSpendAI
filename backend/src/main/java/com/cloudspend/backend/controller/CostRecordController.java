package com.cloudspend.backend.controller;
import com.cloudspend.backend.dto.CostRecordRequest;
import com.cloudspend.backend.dto.CostRecordResponse;
import com.cloudspend.backend.dto.CostAnalyticsResponse;

import com.cloudspend.backend.entity.CostRecord;
import com.cloudspend.backend.service.CostRecordService;
import com.cloudspend.backend.service.DataGeneratorService;
import org.springframework.context.annotation.Profile;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/costs")
public class CostRecordController {

    private final CostRecordService service;
    private final DataGeneratorService dataGeneratorService;

    public CostRecordController(
            CostRecordService service,
            DataGeneratorService dataGeneratorService) {

        this.service = service;
        this.dataGeneratorService = dataGeneratorService;
    }

@GetMapping
public List<CostRecord> getAllCosts() {
    return service.getAllCosts();
}

@PostMapping
public CostRecordResponse createCost(
        @Valid @RequestBody CostRecordRequest request) {

    CostRecord costRecord = new CostRecord();

    costRecord.setUsageDate(request.getUsageDate());
    costRecord.setServiceName(request.getServiceName());
    costRecord.setResourceName(request.getResourceName());
    costRecord.setResourceGroup(request.getResourceGroup());
    costRecord.setRegion(request.getRegion());
    costRecord.setEnvironment(request.getEnvironment());
    costRecord.setDepartment(request.getDepartment());
    costRecord.setCost(request.getCost());
    costRecord.setCurrency(request.getCurrency());

    CostRecord savedCost = service.createCost(costRecord);

    CostRecordResponse response = new CostRecordResponse();

    response.setId(savedCost.getId());
    response.setUsageDate(savedCost.getUsageDate());
    response.setServiceName(savedCost.getServiceName());
    response.setResourceName(savedCost.getResourceName());
    response.setResourceGroup(savedCost.getResourceGroup());
    response.setRegion(savedCost.getRegion());
    response.setEnvironment(savedCost.getEnvironment());
    response.setDepartment(savedCost.getDepartment());
    response.setCost(savedCost.getCost());
    response.setCurrency(savedCost.getCurrency());

    return response;
}

    @Profile("dev")
@PostMapping("/generate")
    public String generateData() {
        int count = dataGeneratorService.generateData();
        return "Generated " + count + " cost records successfully.";
    }

    @GetMapping("/analytics/total")
    public BigDecimal getTotalCost() {
        return service.getTotalCost();
    }

@GetMapping("/analytics/daily")
public List<CostAnalyticsResponse> getDailyCost() {
    return service.getDailyCost();
}

@GetMapping("/analytics/services")
public List<CostAnalyticsResponse> getCostByService() {
    return service.getCostByService();
}

@GetMapping("/analytics/regions")
public List<CostAnalyticsResponse> getCostByRegion() {
    return service.getCostByRegion();
}

@GetMapping("/analytics/departments")
public List<CostAnalyticsResponse> getCostByDepartment() {
    return service.getCostByDepartment();
}

@GetMapping("/analytics/environments")
public List<CostAnalyticsResponse> getCostByEnvironment() {
    return service.getCostByEnvironment();
}
}