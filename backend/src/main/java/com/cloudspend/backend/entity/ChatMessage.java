package com.cloudspend.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_chat_messages", indexes = {
        @Index(name = "idx_ai_chat_user_time", columnList = "userEmail, createdAt")
})
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 320)
    private String userEmail;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false, length = 8000)
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public ChatMessage() {}

    public ChatMessage(String userEmail, String role, String content) {
        this.userEmail = userEmail;
        this.role = role;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getUserEmail() { return userEmail; }
    public String getRole() { return role; }
    public String getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
