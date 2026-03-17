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
@Table(name = "workflows")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Workflow {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer version = 1;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "input_schema", columnDefinition = "JSON")
    private String inputSchema = "{\"fields\":[],\"required\":[]}";

    @Column(name = "start_step_id")
    private UUID startStepId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private User updatedBy;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("stepOrder ASC")
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private List<Step> steps = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
