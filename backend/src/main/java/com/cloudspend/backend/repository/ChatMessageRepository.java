package com.cloudspend.backend.repository;

import com.cloudspend.backend.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findTop12ByUserEmailOrderByCreatedAtDesc(String userEmail);

    void deleteByUserEmail(String userEmail);
}
