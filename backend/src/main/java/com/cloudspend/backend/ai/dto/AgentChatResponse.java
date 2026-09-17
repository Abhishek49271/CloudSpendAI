package com.cloudspend.backend.ai.dto;

import java.util.List;

public record AgentChatResponse(
        String response,
        List<AgentAction> actions
) {
}