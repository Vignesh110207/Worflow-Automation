package com.flowise.service;

import com.flowise.dto.DTOs.*;
import com.flowise.entity.Notification;
import com.flowise.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notifRepo;

    public void create(UUID userId, String title, String message, String type, UUID executionId) {
        try {
            notifRepo.save(Notification.builder()
                    .userId(userId).title(title).message(message)
                    .type(type).isRead(false).executionId(executionId)
                    .build());
        } catch (Exception ignored) {}
    }

    public ApiResponse<NotificationsData> getForUser(UUID userId) {
        List<Notification> list = notifRepo.findByUserIdOrderByCreatedAtDesc(userId);
        long unread = notifRepo.countByUserIdAndIsReadFalse(userId);
        List<NotificationResponse> resp = list.stream().map(this::toResponse).collect(Collectors.toList());
        return ApiResponse.ok(new NotificationsData(resp, unread));
    }

    public ApiResponse<Void> markRead(UUID id, UUID userId) {
        notifRepo.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setIsRead(true);
                notifRepo.save(n);
            }
        });
        return ApiResponse.ok("Marked as read", null);
    }

    public ApiResponse<Void> markAllRead(UUID userId) {
        notifRepo.findByUserIdOrderByCreatedAtDesc(userId).forEach(n -> {
            n.setIsRead(true);
            notifRepo.save(n);
        });
        return ApiResponse.ok("All marked as read", null);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId()).title(n.getTitle()).message(n.getMessage())
                .type(n.getType()).isRead(n.getIsRead())
                .executionId(n.getExecutionId()).createdAt(n.getCreatedAt())
                .build();
    }
}
