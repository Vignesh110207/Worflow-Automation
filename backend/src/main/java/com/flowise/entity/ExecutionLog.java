package com.flowise.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "execution_logs")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Execution execution;

    @Column(name = "step_id")
    private UUID stepId;

    @Column(name = "step_name", length = 200)
    private String stepName;

    @Column(name = "log_level", length = 20)
    private String logLevel = "info";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
