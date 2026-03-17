package com.flowise.repository;
import com.flowise.entity.Execution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
@Repository
public interface ExecutionRepository extends JpaRepository<Execution, UUID> {
    Page<Execution> findByTriggeredBy(UUID userId, Pageable pageable);
    Page<Execution> findByStatus(Execution.ExecutionStatus status, Pageable pageable);
}
