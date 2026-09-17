package com.cloudspend.backend.ai.service;

import com.cloudspend.backend.entity.ChatMessage;
import com.cloudspend.backend.repository.ChatMessageRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class ChatMemoryService {

    private final ChatMessageRepository repository;

    public ChatMemoryService(ChatMessageRepository repository) {
        this.repository = repository;
    }

    public List<ChatMessage> recent(String userEmail) {
        List<ChatMessage> messages =
                repository.findTop12ByUserEmailOrderByCreatedAtDesc(userEmail);
        Collections.reverse(messages);
        return messages;
    }

    public void remember(String userEmail, String role, String content) {
        String safe = content == null ? "" : content.trim();
        if (safe.isBlank()) return;

        if (safe.length() > 8000) {
            safe = safe.substring(0, 8000);
        }

        repository.save(new ChatMessage(userEmail, role, safe));
    }

    public void clear(String userEmail) {
        repository.deleteByUserEmail(userEmail);
    }
}
