package com.flowise.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "executions")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Execution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workflow_id", nullable = false)
    private UUID workflowId;

    @Column(name = "workflow_name", length = 200)
    private String workflowName;

    @Column(name = "workflow_version", nullable = false)
    private Integer workflowVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExecutionStatus status = ExecutionStatus.pending;

    @Column(name = "input_data", columnDefinition = "JSON")
    private String inputData = "{}";

    @Column(name = "current_step_id")
    private UUID currentStepId;

    @Column(name = "triggered_by")
    private UUID triggeredBy;

    @Column(name = "triggered_by_name", length = 100)
    private String triggeredByName;

    @Column(nullable = false)
    private Integer retries = 0;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @OneToMany(mappedBy = "execution", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private List<ExecutionLog> logs = new ArrayList<>();

    @OneToMany(mappedBy = "execution", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private List<ApprovalAction> approvals = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ExecutionStatus { pending, in_progress, completed, failed, canceled }
}
