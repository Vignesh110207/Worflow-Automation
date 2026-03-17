package com.flowise.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rules")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Rule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Step step;

    @Column(name = "rule_condition", nullable = false, columnDefinition = "TEXT")
    private String ruleCondition;

    @Column(name = "next_step_id")
    private UUID nextStepId;

    @Column(nullable = false)
    private Integer priority = 1;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
