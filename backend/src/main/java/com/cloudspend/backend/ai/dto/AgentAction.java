package com.cloudspend.backend.ai.dto;

import java.util.Map;

public record AgentAction(
        String type,
        Map<String, Object> parameters
) {
}