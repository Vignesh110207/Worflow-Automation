package com.flowise.service;

import com.flowise.entity.AuditLog;
import com.flowise.entity.Notification;
import com.flowise.entity.User;
import com.flowise.repository.AuditLogRepository;
import com.flowise.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditRepo;

    public void log(User user, String action, String resourceType, UUID resourceId, String resourceName, String ip) {
        try {
            auditRepo.save(AuditLog.builder()
                    .userId(user != null ? user.getId() : null)
                    .userName(user != null ? user.getName() : "system")
                    .userEmail(user != null ? user.getEmail() : null)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .resourceName(resourceName)
                    .ipAddress(ip)
                    .build());
        } catch (Exception ignored) {}
    }
}
