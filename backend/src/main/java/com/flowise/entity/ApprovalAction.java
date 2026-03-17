package com.flowise.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "approval_actions")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ApprovalAction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Execution execution;

    @Column(name = "step_id")
    private UUID stepId;

    @Column(nullable = false, length = 20)
    private String action;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "acted_by")
    private UUID actedBy;

    @Column(name = "acted_by_name", length = 100)
    private String actedByName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
