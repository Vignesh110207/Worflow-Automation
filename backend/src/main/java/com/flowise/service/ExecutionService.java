package com.flowise.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowise.dto.DTOs.*;
import com.flowise.entity.*;
import com.flowise.exception.BadRequestException;
import com.flowise.exception.ResourceNotFoundException;
import com.flowise.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExecutionService {

    private final ExecutionRepository      execRepo;
    private final ExecutionLogRepository   logRepo;
    private final ApprovalActionRepository approvalRepo;
    private final WorkflowRepository       workflowRepo;
    private final StepRepository           stepRepo;
    private final RuleRepository           ruleRepo;
    private final NotificationService      notifService;
    private final AuditService             auditService;
    private final ObjectMapper             mapper;

    /* ── Start execution ── */
    @Transactional
    public ApiResponse<ExecutionResponse> start(UUID workflowId, ExecuteRequest req, User actor) {
        Workflow wf = workflowRepo.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));
        if (!Boolean.TRUE.equals(wf.getIsActive())) {
            throw new BadRequestException("Workflow is inactive");
        }

        // Validate required fields from schema
        Map<String, Object> inputData = toMap(req.getInputData());
        validateRequiredFields(wf.getInputSchema(), inputData);

        // Get first step
        List<Step> steps = stepRepo.findByWorkflowIdOrderByStepOrderAsc(workflowId);
        Step firstStep = steps.isEmpty() ? null : steps.get(0);

        Execution exec = execRepo.save(Execution.builder()
                .workflowId(workflowId).workflowName(wf.getName())
                .workflowVersion(wf.getVersion())
                .status(Execution.ExecutionStatus.in_progress)
                .inputData(toJson(inputData))
                .currentStepId(firstStep != null ? firstStep.getId() : null)
                .triggeredBy(actor.getId()).triggeredByName(actor.getName())
                .retries(0).startedAt(LocalDateTime.now())
                .build());

        addLog(exec, null, null, "info", "Execution started by " + actor.getName());

        // Evaluate rules on first step
        if (firstStep != null) {
            addLog(exec, firstStep.getId(), firstStep.getName(), "info", "Processing step: " + firstStep.getName());
            routeStep(exec, firstStep, inputData, steps);
        } else {
            exec.setStatus(Execution.ExecutionStatus.completed);
            exec.setEndedAt(LocalDateTime.now());
            execRepo.save(exec);
            addLog(exec, null, null, "success", "Workflow completed — no steps defined");
        }

        notifService.create(actor.getId(), "Execution started",
                "Workflow \"" + wf.getName() + "\" started", "success", exec.getId());
        auditService.log(actor, "EXECUTE_WORKFLOW", "execution", exec.getId(), wf.getName(), null);
        return ApiResponse.ok("Execution started", toResponse(exec));
    }

    private void routeStep(Execution exec, Step step, Map<String, Object> inputData, List<Step> allSteps) {
        List<Rule> rules = ruleRepo.findByStepIdOrderByPriorityAsc(step.getId());
        for (Rule rule : rules) {
            boolean matched = evaluateCondition(rule.getRuleCondition(), inputData);
            if (matched) {
                addLog(exec, step.getId(), step.getName(), "success",
                        "Rule matched: \"" + rule.getRuleCondition() + "\" (priority " + rule.getPriority() + ")");
                if (rule.getNextStepId() != null) {
                    Step next = stepRepo.findById(rule.getNextStepId()).orElse(null);
                    if (next != null) {
                        exec.setCurrentStepId(next.getId());
                        execRepo.save(exec);
                        addLog(exec, next.getId(), next.getName(), "info", "Routed to step: " + next.getName());
                    }
                } else {
                    exec.setStatus(Execution.ExecutionStatus.completed);
                    exec.setEndedAt(LocalDateTime.now());
                    execRepo.save(exec);
                    addLog(exec, null, null, "success", "Workflow completed successfully");
                }
                return;
            }
        }
        // No rule matched — stay on current step (waiting for approval or manual action)
        addLog(exec, step.getId(), step.getName(), "warn",
                "No rule matched — step awaiting action: " + step.getName());
    }

    /* ── List executions ── */
    public ApiResponse<PageData<ExecutionResponse>> list(int page, int size, String status, User actor) {
        PageRequest pr = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Execution> result;
        if (actor.getRole() == User.Role.user) {
            result = execRepo.findByTriggeredBy(actor.getId(), pr);
        } else if (status != null && !status.isBlank()) {
            try {
                result = execRepo.findByStatus(Execution.ExecutionStatus.valueOf(status), pr);
            } catch (IllegalArgumentException e) { result = execRepo.findAll(pr); }
        } else {
            result = execRepo.findAll(pr);
        }
        List<ExecutionResponse> content = result.getContent().stream()
                .map(this::toResponse).collect(Collectors.toList());
        return ApiResponse.ok(new PageData<>(content, page, size, result.getTotalElements(), result.getTotalPages()));
    }

    /* ── Get single execution ── */
    public ApiResponse<ExecutionResponse> get(UUID id) {
        Execution exec = execRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found"));
        return ApiResponse.ok(toResponseWithDetails(exec));
    }

    /* ── Cancel ── */
    @Transactional
    public ApiResponse<ExecutionResponse> cancel(UUID id, User actor) {
        Execution exec = execRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found"));
        if (exec.getStatus() != Execution.ExecutionStatus.in_progress &&
            exec.getStatus() != Execution.ExecutionStatus.pending) {
            throw new BadRequestException("Cannot cancel — execution is not in progress");
        }
        exec.setStatus(Execution.ExecutionStatus.canceled);
        exec.setEndedAt(LocalDateTime.now());
        execRepo.save(exec);
        addLog(exec, null, null, "warn", "Execution canceled by " + actor.getName());
        return ApiResponse.ok("Execution canceled", toResponse(exec));
    }

    /* ── Retry ── */
    @Transactional
    public ApiResponse<ExecutionResponse> retry(UUID id, User actor) {
        Execution exec = execRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found"));
        if (exec.getStatus() != Execution.ExecutionStatus.failed) {
            throw new BadRequestException("Only failed executions can be retried");
        }
        exec.setStatus(Execution.ExecutionStatus.in_progress);
        exec.setEndedAt(null);
        exec.setRetries(exec.getRetries() + 1);
        execRepo.save(exec);
        addLog(exec, null, null, "info", "Retried by " + actor.getName() + " (attempt " + exec.getRetries() + ")");
        return ApiResponse.ok("Execution retried", toResponse(exec));
    }

    /* ── Approve / Reject ── */
    @Transactional
    public ApiResponse<ExecutionResponse> approve(UUID id, ApprovalRequest req, User actor) {
        Execution exec = execRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found"));

        approvalRepo.save(ApprovalAction.builder()
                .execution(exec).stepId(exec.getCurrentStepId())
                .action(req.getAction()).comment(req.getComment())
                .actedBy(actor.getId()).actedByName(actor.getName())
                .build());

        addLog(exec, exec.getCurrentStepId(), null, "approved".equals(req.getAction()) ? "success" : "warn",
                "Step " + req.getAction() + " by " + actor.getName()
                + (req.getComment() != null ? ": " + req.getComment() : ""));

        if ("rejected".equals(req.getAction())) {
            exec.setStatus(Execution.ExecutionStatus.failed);
            exec.setEndedAt(LocalDateTime.now());
            execRepo.save(exec);
            addLog(exec, null, null, "error", "Execution failed — step was rejected");
        } else {
            // Move to next step via DEFAULT rule
            if (exec.getCurrentStepId() != null) {
                List<Rule> rules = ruleRepo.findByStepIdOrderByPriorityAsc(exec.getCurrentStepId());
                Rule defaultRule = rules.stream()
                        .filter(r -> "DEFAULT".equalsIgnoreCase(r.getRuleCondition()) || rules.indexOf(r) == rules.size() - 1)
                        .findFirst().orElse(rules.isEmpty() ? null : rules.get(rules.size() - 1));
                if (defaultRule != null && defaultRule.getNextStepId() != null) {
                    Step next = stepRepo.findById(defaultRule.getNextStepId()).orElse(null);
                    if (next != null) {
                        exec.setCurrentStepId(next.getId());
                        execRepo.save(exec);
                        addLog(exec, next.getId(), next.getName(), "info", "Moved to: " + next.getName());
                    }
                } else {
                    exec.setStatus(Execution.ExecutionStatus.completed);
                    exec.setEndedAt(LocalDateTime.now());
                    execRepo.save(exec);
                    addLog(exec, null, null, "success", "Workflow completed successfully");
                }
            }
        }

        // Notify the person who triggered the execution
        notifService.create(exec.getTriggeredBy(),
                "Step " + req.getAction(),
                "Your workflow \"" + exec.getWorkflowName() + "\" step was " + req.getAction() + " by " + actor.getName(),
                "approved".equals(req.getAction()) ? "success" : "error",
                exec.getId());

        return ApiResponse.ok("Step " + req.getAction(), toResponseWithDetails(exec));
    }

    /* ── Execution logs (all) ── */
    public ApiResponse<PageData<ExecLogResponse>> allLogs(int page, int size) {
        PageRequest pr = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ExecutionLog> result = logRepo.findAll(pr);
        List<ExecLogResponse> content = result.getContent().stream()
                .map(this::toLogResponse).collect(Collectors.toList());
        return ApiResponse.ok(new PageData<>(content, page, size, result.getTotalElements(), result.getTotalPages()));
    }

    /* ── Admin stats ── */
    public ApiResponse<AdminStats> adminStats() {
        long totalUsers    = 0; // filled by AdminController
        long totalWf       = workflowRepo.count();
        long activeWf      = workflowRepo.findAll().stream().filter(w -> Boolean.TRUE.equals(w.getIsActive())).count();
        long totalExec     = execRepo.count();
        long completed     = execRepo.findAll().stream().filter(e -> e.getStatus() == Execution.ExecutionStatus.completed).count();
        long failed        = execRepo.findAll().stream().filter(e -> e.getStatus() == Execution.ExecutionStatus.failed).count();
        long running       = execRepo.findAll().stream().filter(e -> e.getStatus() == Execution.ExecutionStatus.in_progress).count();
        List<ExecutionResponse> recent = execRepo.findAll(PageRequest.of(0, 5, Sort.by("createdAt").descending()))
                .getContent().stream().map(this::toResponse).collect(Collectors.toList());
        return ApiResponse.ok(AdminStats.builder()
                .totalWorkflows(totalWf).activeWorkflows(activeWf)
                .totalExecutions(totalExec).completedExecutions(completed)
                .failedExecutions(failed).runningExecutions(running)
                .recentExecutions(recent).build());
    }

    /* ── Helpers ── */
    private void addLog(Execution exec, UUID stepId, String stepName, String level, String message) {
        try {
            logRepo.save(ExecutionLog.builder()
                    .execution(exec).stepId(stepId).stepName(stepName)
                    .logLevel(level).message(message).build());
        } catch (Exception ignored) {}
    }

    private boolean evaluateCondition(String condition, Map<String, Object> data) {
        if (condition == null || condition.trim().equalsIgnoreCase("DEFAULT")) return true;
        try {
            // Simple evaluator: supports ==, !=, >, <, >=, <=, &&, ||
            String expr = condition;
            // Replace field names with values
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                String k = entry.getKey();
                Object v = entry.getValue();
                String val = v instanceof String ? "\"" + v + "\"" : String.valueOf(v);
                expr = expr.replaceAll("\\b" + k + "\\b", val);
            }
            return evalSimple(expr);
        } catch (Exception e) {
            log.warn("Rule evaluation failed for: {} — {}", condition, e.getMessage());
            return false;
        }
    }

    private boolean evalSimple(String expr) {
        expr = expr.trim();
        // Handle &&
        if (expr.contains("&&")) {
            String[] parts = expr.split("&&", 2);
            return evalSimple(parts[0]) && evalSimple(parts[1]);
        }
        // Handle ||
        if (expr.contains("||")) {
            String[] parts = expr.split("\\|\\|", 2);
            return evalSimple(parts[0]) || evalSimple(parts[1]);
        }
        // Handle comparisons
        String[] ops = {">=", "<=", "!=", "==", ">", "<"};
        for (String op : ops) {
            if (expr.contains(op)) {
                String[] parts = expr.split(op, 2);
                String left  = parts[0].trim().replaceAll("\"", "");
                String right = parts[1].trim().replaceAll("\"", "");
                try {
                    double l = Double.parseDouble(left);
                    double r = Double.parseDouble(right);
                    return switch (op) {
                        case "==" -> l == r;
                        case "!=" -> l != r;
                        case ">"  -> l >  r;
                        case "<"  -> l <  r;
                        case ">=" -> l >= r;
                        case "<=" -> l <= r;
                        default   -> false;
                    };
                } catch (NumberFormatException e) {
                    return switch (op) {
                        case "==" -> left.equals(right);
                        case "!=" -> !left.equals(right);
                        default   -> false;
                    };
                }
            }
        }
        return Boolean.parseBoolean(expr);
    }

    private void validateRequiredFields(String schemaJson, Map<String, Object> inputData) {
        try {
            Map<?, ?> schema = mapper.readValue(schemaJson, Map.class);
            List<?> required = (List<?>) schema.get("required");
            if (required != null) {
                List<String> missing = required.stream()
                        .map(Object::toString)
                        .filter(f -> !inputData.containsKey(f) || inputData.get(f) == null || inputData.get(f).toString().isBlank())
                        .collect(Collectors.toList());
                if (!missing.isEmpty()) {
                    throw new BadRequestException("Missing required fields: " + String.join(", ", missing));
                }
            }
        } catch (BadRequestException e) { throw e; }
        catch (Exception ignored) {}
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(Object obj) {
        if (obj == null) return new HashMap<>();
        if (obj instanceof Map) return (Map<String, Object>) obj;
        try { return mapper.convertValue(obj, Map.class); } catch (Exception e) { return new HashMap<>(); }
    }

    private String toJson(Object obj) {
        try { return mapper.writeValueAsString(obj); } catch (Exception e) { return "{}"; }
    }

    private Object parseJson(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try { return mapper.readValue(json, Object.class); } catch (Exception e) { return json; }
    }

    public ExecutionResponse toResponse(Execution e) {
        String currentStepName = null;
        if (e.getCurrentStepId() != null) {
            currentStepName = stepRepo.findById(e.getCurrentStepId()).map(Step::getName).orElse(null);
        }
        return ExecutionResponse.builder()
                .id(e.getId()).workflowId(e.getWorkflowId()).workflowName(e.getWorkflowName())
                .workflowVersion(e.getWorkflowVersion()).status(e.getStatus().name())
                .inputData(parseJson(e.getInputData()))
                .currentStepId(e.getCurrentStepId()).currentStepName(currentStepName)
                .triggeredByName(e.getTriggeredByName()).retries(e.getRetries())
                .startedAt(e.getStartedAt()).endedAt(e.getEndedAt())
                .createdAt(e.getCreatedAt()).build();
    }

    private ExecutionResponse toResponseWithDetails(Execution e) {
        ExecutionResponse r = toResponse(e);
        r.setLogs(logRepo.findByExecutionIdOrderByCreatedAtAsc(e.getId()).stream()
                .map(this::toLogResponse).collect(Collectors.toList()));
        r.setApprovals(approvalRepo.findByExecutionIdOrderByCreatedAtAsc(e.getId()).stream()
                .map(a -> ApprovalResponse.builder().id(a.getId()).stepId(a.getStepId())
                        .action(a.getAction()).comment(a.getComment())
                        .actedByName(a.getActedByName()).createdAt(a.getCreatedAt()).build())
                .collect(Collectors.toList()));
        return r;
    }

    private ExecLogResponse toLogResponse(ExecutionLog l) {
        String wfName = null;
        if (l.getExecution() != null) wfName = l.getExecution().getWorkflowName();
        return ExecLogResponse.builder()
                .id(l.getId()).stepId(l.getStepId()).stepName(l.getStepName())
                .logLevel(l.getLogLevel()).message(l.getMessage())
                .workflowName(wfName).createdAt(l.getCreatedAt()).build();
    }
}
