package com.flowise.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowise.dto.DTOs.*;
import com.flowise.entity.*;
import com.flowise.exception.BadRequestException;
import com.flowise.exception.ResourceNotFoundException;
import com.flowise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowRepository workflowRepo;
    private final StepRepository     stepRepo;
    private final RuleRepository     ruleRepo;
    private final AuditService       auditService;
    private final ObjectMapper       mapper;

    /* ── Workflows ── */

    public ApiResponse<PageData<WorkflowResponse>> list(int page, int size, String search) {
        PageRequest pr = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Workflow> result = (search != null && !search.isBlank())
                ? workflowRepo.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(search, search, pr)
                : workflowRepo.findAll(pr);
        List<WorkflowResponse> content = result.getContent().stream()
                .map(w -> toResponse(w, false)).collect(Collectors.toList());
        return ApiResponse.ok(new PageData<>(content, page, size, result.getTotalElements(), result.getTotalPages()));
    }

    public ApiResponse<WorkflowResponse> get(UUID id) {
        Workflow w = workflowRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + id));
        return ApiResponse.ok(toResponse(w, true));
    }

    @Transactional
    public ApiResponse<WorkflowResponse> create(WorkflowRequest req, User actor) {
        Workflow w = workflowRepo.save(Workflow.builder()
                .name(req.getName()).description(req.getDescription())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .inputSchema(toJson(req.getInputSchema() != null ? req.getInputSchema()
                        : Map.of("fields", List.of(), "required", List.of())))
                .createdBy(actor).updatedBy(actor)
                .version(1).build());
        auditService.log(actor, "CREATE_WORKFLOW", "workflow", w.getId(), w.getName(), null);
        return ApiResponse.ok("Workflow created", toResponse(w, false));
    }

    @Transactional
    public ApiResponse<WorkflowResponse> update(UUID id, WorkflowRequest req, User actor) {
        Workflow w = workflowRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + id));
        if (req.getName() != null)        w.setName(req.getName());
        if (req.getDescription() != null) w.setDescription(req.getDescription());
        if (req.getIsActive() != null)    w.setIsActive(req.getIsActive());
        if (req.getInputSchema() != null) w.setInputSchema(toJson(req.getInputSchema()));
        w.setVersion(w.getVersion() + 1);
        w.setUpdatedBy(actor);
        workflowRepo.save(w);
        auditService.log(actor, "UPDATE_WORKFLOW", "workflow", w.getId(), w.getName(), null);
        return ApiResponse.ok("Workflow updated", toResponse(w, false));
    }

    @Transactional
    public ApiResponse<Void> delete(UUID id, User actor) {
        Workflow w = workflowRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + id));
        auditService.log(actor, "DELETE_WORKFLOW", "workflow", w.getId(), w.getName(), null);
        workflowRepo.deleteById(id);
        return ApiResponse.ok("Workflow deleted", null);
    }

    /* ── Steps ── */

    public ApiResponse<List<StepResponse>> listSteps(UUID workflowId) {
        List<Step> steps = stepRepo.findByWorkflowIdOrderByStepOrderAsc(workflowId);
        return ApiResponse.ok(steps.stream().map(s -> toStepResponse(s, true)).collect(Collectors.toList()));
    }

    @Transactional
    public ApiResponse<StepResponse> addStep(UUID workflowId, StepRequest req, User actor) {
        Workflow w = workflowRepo.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + workflowId));
        Step step = stepRepo.save(Step.builder()
                .workflow(w).name(req.getName()).stepType(req.getStepType())
                .stepOrder(req.getStepOrder() != null ? req.getStepOrder() : 1)
                .assigneeEmail(req.getAssigneeEmail())
                .metadata(toJson(req.getMetadata() != null ? req.getMetadata() : Map.of()))
                .build());
        auditService.log(actor, "ADD_STEP", "step", step.getId(), step.getName(), null);
        return ApiResponse.ok("Step added", toStepResponse(step, false));
    }

    @Transactional
    public ApiResponse<StepResponse> updateStep(UUID stepId, StepRequest req, User actor) {
        Step s = stepRepo.findById(stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Step not found: " + stepId));
        if (req.getName() != null)          s.setName(req.getName());
        if (req.getStepType() != null)      s.setStepType(req.getStepType());
        if (req.getStepOrder() != null)     s.setStepOrder(req.getStepOrder());
        if (req.getAssigneeEmail() != null) s.setAssigneeEmail(req.getAssigneeEmail());
        if (req.getMetadata() != null)      s.setMetadata(toJson(req.getMetadata()));
        stepRepo.save(s);
        auditService.log(actor, "UPDATE_STEP", "step", s.getId(), s.getName(), null);
        return ApiResponse.ok("Step updated", toStepResponse(s, false));
    }

    @Transactional
    public ApiResponse<Void> deleteStep(UUID stepId, User actor) {
        Step s = stepRepo.findById(stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Step not found: " + stepId));
        auditService.log(actor, "DELETE_STEP", "step", s.getId(), s.getName(), null);
        stepRepo.deleteById(stepId);
        return ApiResponse.ok("Step deleted", null);
    }

    /* ── Rules ── */

    public ApiResponse<List<RuleResponse>> listRules(UUID stepId) {
        List<Rule> rules = ruleRepo.findByStepIdOrderByPriorityAsc(stepId);
        return ApiResponse.ok(rules.stream().map(r -> toRuleResponse(r, List.of())).collect(Collectors.toList()));
    }

    @Transactional
    public ApiResponse<RuleResponse> addRule(UUID stepId, RuleRequest req, User actor) {
        Step step = stepRepo.findById(stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Step not found: " + stepId));
        if (ruleRepo.existsByStepIdAndPriority(stepId, req.getPriority())) {
            throw new BadRequestException("Priority " + req.getPriority() + " already exists on this step");
        }
        Rule rule = ruleRepo.save(Rule.builder()
                .step(step).ruleCondition(req.getRuleCondition())
                .nextStepId(req.getNextStepId()).priority(req.getPriority())
                .build());
        auditService.log(actor, "ADD_RULE", "rule", rule.getId(), rule.getRuleCondition(), null);
        return ApiResponse.ok("Rule added", toRuleResponse(rule, List.of()));
    }

    @Transactional
    public ApiResponse<RuleResponse> updateRule(UUID ruleId, RuleRequest req, User actor) {
        Rule r = ruleRepo.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found: " + ruleId));
        if (req.getRuleCondition() != null) r.setRuleCondition(req.getRuleCondition());
        r.setNextStepId(req.getNextStepId());
        if (req.getPriority() != null)      r.setPriority(req.getPriority());
        ruleRepo.save(r);
        return ApiResponse.ok("Rule updated", toRuleResponse(r, List.of()));
    }

    @Transactional
    public ApiResponse<Void> deleteRule(UUID ruleId, User actor) {
        Rule r = ruleRepo.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found: " + ruleId));
        ruleRepo.deleteById(ruleId);
        return ApiResponse.ok("Rule deleted", null);
    }

    /* ── Mappers ── */

    public WorkflowResponse toResponse(Workflow w, boolean includeSteps) {
        List<Step> steps = stepRepo.findByWorkflowIdOrderByStepOrderAsc(w.getId());
        WorkflowResponse.WorkflowResponseBuilder b = WorkflowResponse.builder()
                .id(w.getId()).name(w.getName()).description(w.getDescription())
                .version(w.getVersion()).isActive(w.getIsActive())
                .inputSchema(parseJson(w.getInputSchema()))
                .startStepId(w.getStartStepId())
                .createdByName(w.getCreatedBy() != null ? w.getCreatedBy().getName() : null)
                .stepCount(steps.size())
                .createdAt(w.getCreatedAt()).updatedAt(w.getUpdatedAt());
        if (includeSteps) {
            b.steps(steps.stream().map(s -> toStepResponse(s, true)).collect(Collectors.toList()));
        }
        return b.build();
    }

    public StepResponse toStepResponse(Step s, boolean includeRules) {
        List<Step> allSteps = s.getWorkflow() != null
                ? stepRepo.findByWorkflowIdOrderByStepOrderAsc(s.getWorkflow().getId())
                : List.of();
        return StepResponse.builder()
                .id(s.getId()).workflowId(s.getWorkflow() != null ? s.getWorkflow().getId() : null)
                .name(s.getName()).stepType(s.getStepType().name())
                .stepOrder(s.getStepOrder()).assigneeEmail(s.getAssigneeEmail())
                .metadata(parseJson(s.getMetadata()))
                .rules(includeRules
                        ? ruleRepo.findByStepIdOrderByPriorityAsc(s.getId()).stream()
                            .map(r -> toRuleResponse(r, allSteps)).collect(Collectors.toList())
                        : List.of())
                .createdAt(s.getCreatedAt())
                .build();
    }

    public RuleResponse toRuleResponse(Rule r, List<Step> allSteps) {
        String nextName = null;
        if (r.getNextStepId() != null) {
            nextName = allSteps.stream()
                    .filter(s -> s.getId().equals(r.getNextStepId()))
                    .map(Step::getName).findFirst()
                    .orElse(null);
            if (nextName == null) {
                nextName = stepRepo.findById(r.getNextStepId()).map(Step::getName).orElse(null);
            }
        }
        return RuleResponse.builder()
                .id(r.getId()).stepId(r.getStep().getId())
                .ruleCondition(r.getRuleCondition())
                .nextStepId(r.getNextStepId()).nextStepName(nextName)
                .priority(r.getPriority()).createdAt(r.getCreatedAt())
                .build();
    }

    private String toJson(Object obj) {
        try { return mapper.writeValueAsString(obj); } catch (Exception e) { return "{}"; }
    }

    private Object parseJson(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try { return mapper.readValue(json, Object.class); } catch (Exception e) { return json; }
    }
}
