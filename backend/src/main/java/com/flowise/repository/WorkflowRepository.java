package com.flowise.repository;

import com.flowise.entity.Workflow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, UUID> {
    Page<Workflow> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String desc, Pageable pageable);
    boolean existsByName(String name);
}
