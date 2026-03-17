package com.flowise.controller;

import com.flowise.dto.DTOs.*;
import com.flowise.entity.User;
import com.flowise.repository.AuditLogRepository;
import com.flowise.repository.UserRepository;
import com.flowise.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/* ══════════════════════════════════════════
   AUTH CONTROLLER
   ══════════════════════════════════════════ */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        return ResponseEntity.ok(authService.login(req, http.getRemoteAddr()));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getMe(user));
    }
}

/* ══════════════════════════════════════════
   WORKFLOW CONTROLLER
   ══════════════════════════════════════════ */
@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
class WorkflowController {
    private final WorkflowService workflowService;
    private final ExecutionService executionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageData<WorkflowResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(workflowService.list(page, size, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkflowResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(workflowService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
    public ResponseEntity<ApiResponse<WorkflowResponse>> create(
            @Valid @RequestBody WorkflowRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workflowService.create(req, user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
    public ResponseEntity<ApiResponse<WorkflowResponse>> update(
            @PathVariable UUID id, @RequestBody WorkflowRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.update(id, req, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.delete(id, user));
    }

    @PostMapping("/{id}/execute")
    public ResponseEntity<ApiResponse<ExecutionResponse>> execute(
            @PathVariable UUID id, @RequestBody(required = false) ExecuteRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(executionService.start(id, req != null ? req : new ExecuteRequest(), user));
    }

    // Steps
    @GetMapping("/{workflowId}/steps")
    public ResponseEntity<ApiResponse<List<StepResponse>>> listSteps(@PathVariable UUID workflowId) {
        return ResponseEntity.ok(workflowService.listSteps(workflowId));
    }

    @PostMapping("/{workflowId}/steps")
    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
    public ResponseEntity<ApiResponse<StepResponse>> addStep(
            @PathVariable UUID workflowId, @Valid @RequestBody StepRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workflowService.addStep(workflowId, req, user));
    }
}

/* ══════════════════════════════════════════
   STEP CONTROLLER
   ══════════════════════════════════════════ */
@RestController
@RequestMapping("/api/steps")
@RequiredArgsConstructor
class StepController {
    private final WorkflowService workflowService;

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
    public ResponseEntity<ApiResponse<StepResponse>> update(
            @PathVariable UUID id, @RequestBody StepRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.updateStep(id, req, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.deleteStep(id, user));
    }

    @GetMapping("/{stepId}/rules")
    public ResponseEntity<ApiResponse<List<RuleResponse>>> listRules(@PathVariable UUID stepId) {
        return ResponseEntity.ok(workflowService.listRules(stepId));
    }

    @PostMapping("/{stepId}/rules")
    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
    public ResponseEntity<ApiResponse<RuleResponse>> addRule(
            @PathVariable UUID stepId, @Valid @RequestBody RuleRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workflowService.addRule(stepId, req, user));
    }
}

/* ══════════════════════════════════════════
   RULE CONTROLLER
   ══════════════════════════════════════════ */
@RestController
@RequestMapping("/api/rules")
@RequiredArgsConstructor
class RuleController {
    private final WorkflowService workflowService;

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
    public ResponseEntity<ApiResponse<RuleResponse>> update(
            @PathVariable UUID id, @RequestBody RuleRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.updateRule(id, req, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.deleteRule(id, user));
    }
}

/* ══════════════════════════════════════════
   EXECUTION CONTROLLER
   ══════════════════════════════════════════ */
@RestController
@RequestMapping("/api/executions")
@RequiredArgsConstructor
class ExecutionController {
    private final ExecutionService executionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageData<ExecutionResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(executionService.list(page, size, status, user));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
    public ResponseEntity<ApiResponse<PageData<ExecLogResponse>>> allLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(executionService.allLogs(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExecutionResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(executionService.get(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<ExecutionResponse>> cancel(
            @PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(executionService.cancel(id, user));
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<ApiResponse<ExecutionResponse>> retry(
            @PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(executionService.retry(id, user));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<ExecutionResponse>> approve(
            @PathVariable UUID id, @Valid @RequestBody ApprovalRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(executionService.approve(id, req, user));
    }
}

/* ══════════════════════════════════════════
   NOTIFICATION CONTROLLER
   ══════════════════════════════════════════ */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
class NotificationController {
    private final NotificationService notifService;

    @GetMapping
    public ResponseEntity<ApiResponse<NotificationsData>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notifService.getForUser(user.getId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notifService.markRead(id, user.getId()));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notifService.markAllRead(user.getId()));
    }
}

/* ══════════════════════════════════════════
   ADMIN CONTROLLER
   ══════════════════════════════════════════ */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
class AdminController {
    private final AuthService authService;
    private final ExecutionService executionService;
    private final UserRepository userRepo;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStats>> stats() {
        ApiResponse<AdminStats> r = executionService.adminStats();
        long totalUsers  = userRepo.count();
        long activeUsers = userRepo.findAll().stream().filter(u -> Boolean.TRUE.equals(u.getIsActive())).count();
        r.getData().setTotalUsers(totalUsers);
        r.getData().setActiveUsers(activeUsers);
        return ResponseEntity.ok(r);
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageData<UserResponse>>> users(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(authService.listUsers(page, size, search));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID id, @RequestBody UpdateUserRequest req,
            @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(authService.updateUser(id, req, actor));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable UUID id, @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(authService.deleteUser(id, actor));
    }
}

/* ══════════════════════════════════════════
   AUDIT CONTROLLER
   ══════════════════════════════════════════ */
@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
class AuditController {
    private final AuditLogRepository auditRepo;

    @GetMapping
    public ResponseEntity<ApiResponse<PageData<AuditLogResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String search) {
        var pr = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var result = search.isBlank()
                ? auditRepo.findAll(pr)
                : auditRepo.findByUserNameContainingIgnoreCaseOrActionContainingIgnoreCaseOrResourceTypeContainingIgnoreCase(search, search, search, pr);
        var content = result.getContent().stream().map(a -> AuditLogResponse.builder()
                .id(a.getId()).userName(a.getUserName()).userEmail(a.getUserEmail())
                .action(a.getAction()).resourceType(a.getResourceType())
                .resourceId(a.getResourceId()).resourceName(a.getResourceName())
                .ipAddress(a.getIpAddress()).createdAt(a.getCreatedAt()).build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(
                new PageData<>(content, page, size, result.getTotalElements(), result.getTotalPages())));
    }
}
