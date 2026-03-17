package com.flowise.repository;
import com.flowise.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByUserNameContainingIgnoreCaseOrActionContainingIgnoreCaseOrResourceTypeContainingIgnoreCase(
        String name, String action, String type, Pageable pageable);
}
