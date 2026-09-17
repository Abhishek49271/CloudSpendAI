package com.cloudspend.backend.service;

import com.cloudspend.backend.entity.CostRecord;
import com.cloudspend.backend.repository.CostRecordRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Random;

@Service
public class DataGeneratorService {

    private final CostRecordRepository repository;
    private final Random random = new Random();

    private final String[] services = {
            "Virtual Machines",
            "Azure SQL Database",
            "Blob Storage",
            "App Service",
            "Azure Kubernetes Service",
            "Azure Functions",
            "Cosmos DB",
            "Azure Monitor",
            "Virtual Network",
            "Container Registry"
    };

    private final String[] regions = {
            "East US",
            "West US",
            "Central US",
            "North Europe",
            "West Europe",
            "Southeast Asia"
    };

    private final String[] environments = {
            "Production",
            "Development",
            "Testing"
    };

    private final String[] departments = {
            "Engineering",
            "Finance",
            "Marketing",
            "Operations",
            "Data Science"
    };

    public DataGeneratorService(CostRecordRepository repository) {
        this.repository = repository;
    }

    public int generateData() {

        LocalDate startDate = LocalDate.of(2026, 6, 1);

        int resourceCount = 50;
        int days = 90;

        List<CostRecord> records = new java.util.ArrayList<>();

        for (int resource = 1; resource <= resourceCount; resource++) {

            String service = services[(resource - 1) % services.length];

            String resourceName =
                    getResourcePrefix(service) + "-" +
                    String.format("%02d", resource);

            String resourceGroup =
                    "RG-" + environments[(resource - 1) % environments.length];

            String region =
                    regions[(resource - 1) % regions.length];

            String environment =
                    environments[(resource - 1) % environments.length];

            String department =
                    departments[(resource - 1) % departments.length];

            double baseCost = getBaseCost(service);

            for (int day = 0; day < days; day++) {

                LocalDate date = startDate.plusDays(day);

                double variation =
                        0.85 + (random.nextDouble() * 0.30);

                double cost = baseCost * variation;

                // Create occasional artificial cost spikes
                if (day % 29 == 0 && resource % 7 == 0) {
                    cost *= 3.5;
                }

                CostRecord record = new CostRecord();

                record.setUsageDate(date);
                record.setServiceName(service);
                record.setResourceName(resourceName);
                record.setResourceGroup(resourceGroup);
                record.setRegion(region);
                record.setEnvironment(environment);
                record.setDepartment(department);
                record.setCost(
                        BigDecimal.valueOf(cost)
                                .setScale(2, RoundingMode.HALF_UP)
                );
                record.setCurrency("USD");

                records.add(record);
            }
        }

        repository.saveAll(records);

        return records.size();
    }

    private double getBaseCost(String service) {

        return switch (service) {

            case "Virtual Machines" ->
                    35 + random.nextDouble() * 25;

            case "Azure SQL Database" ->
                    45 + random.nextDouble() * 35;

            case "Blob Storage" ->
                    8 + random.nextDouble() * 15;

            case "App Service" ->
                    20 + random.nextDouble() * 20;

            case "Azure Kubernetes Service" ->
                    50 + random.nextDouble() * 50;

            case "Azure Functions" ->
                    5 + random.nextDouble() * 10;

            case "Cosmos DB" ->
                    30 + random.nextDouble() * 35;

            case "Azure Monitor" ->
                    10 + random.nextDouble() * 15;

            case "Virtual Network" ->
                    5 + random.nextDouble() * 10;

            case "Container Registry" ->
                    5 + random.nextDouble() * 10;

            default -> 10;
        };
    }

    private String getResourcePrefix(String service) {

        return switch (service) {

            case "Virtual Machines" -> "VM";

            case "Azure SQL Database" -> "SQL";

            case "Blob Storage" -> "STORAGE";

            case "App Service" -> "APP";

            case "Azure Kubernetes Service" -> "AKS";

            case "Azure Functions" -> "FUNC";

            case "Cosmos DB" -> "COSMOS";

            case "Azure Monitor" -> "MONITOR";

            case "Virtual Network" -> "VNET";

            case "Container Registry" -> "ACR";

            default -> "RESOURCE";
        };
    }
}