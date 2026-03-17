package com.flowise.dto;

import com.flowise.entity.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class DTOs {

    /* ── Generic API response wrapper ── */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;

        public static <T> ApiResponse<T> ok(T data) {
            return ApiResponse.<T>builder().success(true).message("Success").data(data).build();
        }
        public static <T> ApiResponse<T> ok(String msg, T data) {
            return ApiResponse.<T>builder().success(true).message(msg).data(data).build();
        }
        public static <T> ApiResponse<T> error(String msg) {
            return ApiResponse.<T>builder().success(false).message(msg).build();
        }
    }

    /* ── Page wrapper ── */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PageData<T> {
        private List<T> content;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
    }

    /* ── Auth ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email required")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        @Size(max = 100)
        private String name;

        @NotBlank @Email(message = "Valid email required")
        private String email;

        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        private String role = "user";
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private UserResponse user;
    }

    /* ── User ── */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserResponse {
        private UUID id;
        private String name;
        private String email;
        private String role;
        private Boolean isActive;
        private LocalDateTime lastLogin;
        private LocalDateTime createdAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class UpdateUserRequest {
        private String name;
        private String role;
        private Boolean isActive;
    }

    /* ── Workflow ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class WorkflowRequest {
        @NotBlank(message = "Workflow name is required")
        @Size(max = 200)
        private String name;

        private String description;
        private Boolean isActive = true;
        private Object inputSchema;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WorkflowResponse {
        private UUID id;
        private String name;
        private String description;
        private Integer version;
        private Boolean isActive;
        private Object inputSchema;
        private UUID startStepId;
        private String createdByName;
        private Integer stepCount;
        private List<StepResponse> steps;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    /* ── Step ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class StepRequest {
        @NotBlank(message = "Step name is required")
        @Size(max = 200)
        private String name;

        @NotNull(message = "Step type is required")
        private Step.StepType stepType;

        private Integer stepOrder = 1;

        @Email(message = "Assignee must be valid email")
        private String assigneeEmail;

        private Object metadata;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StepResponse {
        private UUID id;
        private UUID workflowId;
        private String name;
        private String stepType;
        private Integer stepOrder;
        private String assigneeEmail;
        private Object metadata;
        private List<RuleResponse> rules;
        private LocalDateTime createdAt;
    }

    /* ── Rule ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class RuleRequest {
        @NotBlank(message = "Condition is required")
        private String ruleCondition;

        private UUID nextStepId;

        @NotNull @Min(1) @Max(100)
        private Integer priority;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RuleResponse {
        private UUID id;
        private UUID stepId;
        private String ruleCondition;
        private UUID nextStepId;
        private String nextStepName;
        private Integer priority;
        private LocalDateTime createdAt;
    }

    /* ── Execution ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ExecuteRequest {
        private Object inputData;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ExecutionResponse {
        private UUID id;
        private UUID workflowId;
        private String workflowName;
        private Integer workflowVersion;
        private String status;
        private Object inputData;
        private UUID currentStepId;
        private String currentStepName;
        private String triggeredByName;
        private Integer retries;
        private LocalDateTime startedAt;
        private LocalDateTime endedAt;
        private List<ExecLogResponse> logs;
        private List<ApprovalResponse> approvals;
        private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ExecLogResponse {
        private UUID id;
        private UUID stepId;
        private String stepName;
        private String logLevel;
        private String message;
        private String workflowName;
        private LocalDateTime createdAt;
    }

    /* ── Approval ── */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ApprovalRequest {
        @NotBlank
        @Pattern(regexp = "approved|rejected", message = "Action must be 'approved' or 'rejected'")
        private String action;

        @Size(max = 500)
        private String comment;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ApprovalResponse {
        private UUID id;
        private UUID stepId;
        private String action;
        private String comment;
        private String actedByName;
        private LocalDateTime createdAt;
    }

    /* ── Notification ── */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class NotificationResponse {
        private UUID id;
        private String title;
        private String message;
        private String type;
        private Boolean isRead;
        private UUID executionId;
        private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class NotificationsData {
        private List<NotificationResponse> notifications;
        private long unread;
    }

    /* ── AuditLog ── */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AuditLogResponse {
        private UUID id;
        private String userName;
        private String userEmail;
        private String action;
        private String resourceType;
        private UUID resourceId;
        private String resourceName;
        private String ipAddress;
        private LocalDateTime createdAt;
    }

    /* ── Admin stats ── */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AdminStats {
        private long totalUsers;
        private long activeUsers;
        private long totalWorkflows;
        private long activeWorkflows;
        private long totalExecutions;
        private long completedExecutions;
        private long failedExecutions;
        private long runningExecutions;
        private List<ExecutionResponse> recentExecutions;
    }
}
