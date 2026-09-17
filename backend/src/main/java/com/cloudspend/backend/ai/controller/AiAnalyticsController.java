package com.cloudspend.backend.ai.controller;

import com.cloudspend.backend.ai.dto.AiAnomalyResponse;
import com.cloudspend.backend.ai.dto.AiForecastResponse;
import com.cloudspend.backend.ai.dto.AiHealthResponse;
import com.cloudspend.backend.ai.dto.AiInsightResponse;
import com.cloudspend.backend.ai.service.AiAnalyticsService;
import com.cloudspend.backend.ai.service.OllamaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiAnalyticsController {

    private final AiAnalyticsService analyticsService;
    private final OllamaService ollamaService;

    public AiAnalyticsController(AiAnalyticsService analyticsService, OllamaService ollamaService) {
        this.analyticsService = analyticsService;
        this.ollamaService = ollamaService;
    }

    @GetMapping("/insights")
    public ResponseEntity<AiInsightResponse> insights() {
        return ResponseEntity.ok(analyticsService.generateInsights());
    }

    @GetMapping("/anomalies")
    public ResponseEntity<List<AiAnomalyResponse>> anomalies() {
        return ResponseEntity.ok(analyticsService.detectAnomalies());
    }

    @GetMapping("/forecast")
    public ResponseEntity<AiForecastResponse> forecast(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(analyticsService.forecast(days));
    }

    @GetMapping("/health")
    public ResponseEntity<AiHealthResponse> health() {
        return ResponseEntity.ok(ollamaService.health());
    }
}
