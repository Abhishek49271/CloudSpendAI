package com.cloudspend.backend.ai.service;

import com.cloudspend.backend.ai.dto.AiAnomalyResponse;
import com.cloudspend.backend.ai.dto.AiForecastPoint;
import com.cloudspend.backend.ai.dto.AiForecastResponse;
import com.cloudspend.backend.ai.dto.AiInsightResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class AiAnalyticsService {

    //private static final BigDecimal TWO = BigDecimal.valueOf(2);
    private final CostDataService costDataService;

    public AiAnalyticsService(CostDataService costDataService) {
        this.costDataService = costDataService;
    }

    public AiInsightResponse generateInsights() {
        List<String> highlights = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();
        List<String> anomalies = new ArrayList<>();

        BigDecimal total = costDataService.getTotalCost();
        long records = costDataService.getRecordCount();
        List<Object[]> services = costDataService.getCostByService();
        List<Object[]> regions = costDataService.getCostByRegion();
        List<Object[]> departments = costDataService.getCostByDepartment();
        List<Object[]> environments = costDataService.getCostByEnvironment();
        List<Object[]> resources = costDataService.getCostByResource();

        BigDecimal average = records == 0 ? BigDecimal.ZERO : total.divide(BigDecimal.valueOf(records), 2, RoundingMode.HALF_UP);
        highlights.add("Total recorded cloud spend is " + money(total) + " across " + records + " cost records.");
        highlights.add("Average cost per record is " + money(average) + ".");

        addTopHighlight(highlights, "service", services);
        addTopHighlight(highlights, "region", regions);
        addTopHighlight(highlights, "department", departments);
        addTopHighlight(highlights, "environment", environments);
        addTopHighlight(highlights, "resource", resources);

        addConcentrationRecommendation(recommendations, "service", services, total, 0.40);
        addConcentrationRecommendation(recommendations, "region", regions, total, 0.40);
        addConcentrationRecommendation(recommendations, "department", departments, total, 0.35);
        addConcentrationRecommendation(recommendations, "environment", environments, total, 0.50);

        List<AiAnomalyResponse> detected = detectAnomalies();
        for (AiAnomalyResponse item : detected) {
            anomalies.add(item.date() + " daily spend of " + money(item.cost()) + " is " + item.severity().toLowerCase() + " (z-score " + item.zScore().setScale(2, RoundingMode.HALF_UP) + ").");
        }
        if (!detected.isEmpty()) {
            recommendations.add("Review the dates flagged as anomalies and compare the underlying resources, services, and environments before making changes.");
        }
        if (recommendations.isEmpty()) {
            recommendations.add("No high-confidence optimization opportunity was detected from the available cost dimensions.");
        }

        String summary = "CloudSpend AI found " + highlights.size() + " major spending signals and " + detected.size() + " daily anomalies from the current dataset.";
        return new AiInsightResponse(summary, highlights, recommendations, anomalies);
    }

    public List<AiAnomalyResponse> detectAnomalies() {
        List<Object[]> rows = costDataService.getDailyCost();
        if (rows.size() < 4) return List.of();

        double mean = rows.stream().mapToDouble(r -> ((BigDecimal) r[1]).doubleValue()).average().orElse(0);
        double variance = rows.stream().mapToDouble(r -> Math.pow(((BigDecimal) r[1]).doubleValue() - mean, 2)).average().orElse(0);
        double std = Math.sqrt(variance);
        if (std == 0) return List.of();

        List<AiAnomalyResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            LocalDate date = (LocalDate) row[0];
            BigDecimal cost = (BigDecimal) row[1];
            BigDecimal z = BigDecimal.valueOf((cost.doubleValue() - mean) / std).setScale(4, RoundingMode.HALF_UP);
            double abs = Math.abs(z.doubleValue());
            if (abs >= 2.0) {
                String severity = abs >= 3.0 ? "CRITICAL" : "HIGH";
                result.add(new AiAnomalyResponse(date, cost, z, severity));
            }
        }
        result.sort(Comparator.comparingDouble((AiAnomalyResponse x) -> Math.abs(x.zScore().doubleValue())).reversed());
        return result;
    }

    public AiForecastResponse forecast(int days) {
        int horizon = Math.max(1, Math.min(days, 30));
        List<Object[]> rows = costDataService.getDailyCost();
        if (rows.isEmpty()) {
            return new AiForecastResponse("linear-regression", BigDecimal.ZERO, BigDecimal.ZERO, List.of());
        }

        int n = rows.size();
        double sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (int i = 0; i < n; i++) {
            double x = i;
            double y = ((BigDecimal) rows.get(i)[1]).doubleValue();
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }

        double denominator = n * sumXX - sumX * sumX;
        double slope = denominator == 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
        double intercept = (sumY - slope * sumX) / n;
        double average = sumY / n;
        LocalDate lastDate = (LocalDate) rows.get(n - 1)[0];

        List<AiForecastPoint> points = new ArrayList<>();
        for (int i = 1; i <= horizon; i++) {
            double predicted = Math.max(0, intercept + slope * (n - 1 + i));
            points.add(new AiForecastPoint(lastDate.plusDays(i), BigDecimal.valueOf(predicted).setScale(2, RoundingMode.HALF_UP)));
        }

        return new AiForecastResponse(
                "linear-regression",
                BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(slope).setScale(2, RoundingMode.HALF_UP),
                points
        );
    }

    private void addTopHighlight(List<String> target, String dimension, List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) return;
        Object[] top = rows.get(0);
        target.add("Highest " + dimension + " spend: " + top[0] + " at " + money((BigDecimal) top[1]) + ".");
    }

    private void addConcentrationRecommendation(List<String> target, String dimension, List<Object[]> rows, BigDecimal total, double threshold) {
        if (rows == null || rows.isEmpty() || total.signum() <= 0) return;
        BigDecimal top = (BigDecimal) rows.get(0)[1];
        double share = top.divide(total, 8, RoundingMode.HALF_UP).doubleValue();
        if (share >= threshold) {
            target.add("Review " + dimension + " concentration: " + rows.get(0)[0] + " represents " + String.format("%.1f", share * 100) + "% of recorded spend.");
        }
    }

    private String money(BigDecimal value) {
        return "$" + value.setScale(2, RoundingMode.HALF_UP);
    }
}
