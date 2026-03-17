package com.flowise.repository;
import com.flowise.entity.ExecutionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface ExecutionLogRepository extends JpaRepository<ExecutionLog, UUID> {
    List<ExecutionLog> findByExecutionIdOrderByCreatedAtAsc(UUID executionId);
    Page<ExecutionLog> findAll(Pageable pageable);
}
