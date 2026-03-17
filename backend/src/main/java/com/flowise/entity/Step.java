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
@Table(name = "steps")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Step {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Workflow workflow;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "step_type", nullable = false, length = 20)
    private StepType stepType;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder = 1;

    @Column(name = "assignee_email", length = 255)
    private String assigneeEmail;

    @Column(columnDefinition = "JSON")
    private String metadata = "{}";

    @OneToMany(mappedBy = "step", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("priority ASC")
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private List<Rule> rules = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum StepType { task, approval, notification }
}
