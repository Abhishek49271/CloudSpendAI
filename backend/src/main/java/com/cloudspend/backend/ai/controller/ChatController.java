package com.cloudspend.backend.ai.controller;

import com.cloudspend.backend.ai.dto.AgentChatResponse;
import com.cloudspend.backend.ai.service.OllamaService;
import com.cloudspend.backend.entity.ChatMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class ChatController {

    private final OllamaService ollamaService;

    public ChatController(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        String message = request.get("message");

        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Message cannot be empty.")
            );
        }

        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body(
                    Map.of("error", "Authentication required.")
            );
        }

        try {
            AgentChatResponse response = ollamaService.chat(
                    authentication.getName(),
                    message.trim()
            );

            return ResponseEntity.ok(response);

        } catch (Exception exception) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "AI service is currently unavailable.")
            );
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<ChatMessage>> history(
            Authentication authentication) {

        return ResponseEntity.ok(
                ollamaService.history(authentication.getName())
        );
    }

    @DeleteMapping("/history")
    public ResponseEntity<Void> clearHistory(
            Authentication authentication) {

        ollamaService.clearHistory(authentication.getName());

        return ResponseEntity.noContent().build();
    }
}
