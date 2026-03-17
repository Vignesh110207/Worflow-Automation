package com.flowise.repository;
import com.flowise.entity.ApprovalAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface ApprovalActionRepository extends JpaRepository<ApprovalAction, UUID> {
    List<ApprovalAction> findByExecutionIdOrderByCreatedAtAsc(UUID executionId);
}
