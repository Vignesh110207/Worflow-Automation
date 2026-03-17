package com.flowise.repository;
import com.flowise.entity.Rule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface RuleRepository extends JpaRepository<Rule, UUID> {
    List<Rule> findByStepIdOrderByPriorityAsc(UUID stepId);
    boolean existsByStepIdAndPriority(UUID stepId, Integer priority);
}
