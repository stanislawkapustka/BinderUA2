package com.timetracker.controller;

import com.timetracker.entity.Task;
import com.timetracker.entity.Project;
import com.timetracker.repository.TaskRepository;
import com.timetracker.repository.ProjectRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Task>> getTasksByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(taskRepository.findByProjectId(projectId));
    }

    @PostMapping("/project/{projectId}")
    public ResponseEntity<Task> createTask(@PathVariable Long projectId, @Valid @RequestBody Task task) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null)
            return ResponseEntity.notFound().build();

        task.setProjectId(projectId);

        // Validate number presence and prefix match with project number
        if (task.getNumber() == null || task.getNumber().isBlank()) {
            throw new RuntimeException("Task number is required");
        }
        // Extract first segment of project number (e.g., "20031-00" -> "20031-")
        String projectNumber = project.getNumber();
        int firstDash = projectNumber.indexOf('-');
        String requiredPrefix = (firstDash > 0 ? projectNumber.substring(0, firstDash) : projectNumber) + "-";
        if (!task.getNumber().startsWith(requiredPrefix)) {
            throw new RuntimeException("Task number must start with " + requiredPrefix);
        }
        String suffix = task.getNumber().substring(requiredPrefix.length());
        if (suffix.isEmpty()) {
            throw new RuntimeException("Task number suffix is required after " + requiredPrefix);
        }
        if (suffix.length() > 5) {
            throw new RuntimeException("Task number suffix must be at most 5 characters");
        }

        // Validate billing fields
        if (task.getBillingType() == Task.BillingType.UNIT) {
            if (task.getUnitPrice() == null) {
                throw new RuntimeException("Unit price is required for UNIT billing");
            }
            if (task.getUnitName() == null || task.getUnitName().isBlank()) {
                throw new RuntimeException("Unit name is required for UNIT billing");
            }
        } else {
            // Clear unit fields for HOURLY
            task.setUnitPrice(null);
            task.setUnitName(null);
        }

        Task saved = taskRepository.save(task);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @Valid @RequestBody Task updated) {
        Optional<Task> existingOpt = taskRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task t = existingOpt.get();
        t.setTitle(updated.getTitle());
        t.setDescription(updated.getDescription());
        t.setActive(updated.isActive());

        // Validate prefix and billing on update as well
        Optional<Project> projOpt = projectRepository.findById(t.getProjectId());
        if (projOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Project project = projOpt.get();

        if (updated.getNumber() == null || updated.getNumber().isBlank()) {
            throw new RuntimeException("Task number is required");
        }
        // Extract first segment of project number (e.g., "20031-00" -> "20031-")
        String projectNumber = project.getNumber();
        int firstDash = projectNumber.indexOf('-');
        String requiredPrefix = (firstDash > 0 ? projectNumber.substring(0, firstDash) : projectNumber) + "-";
        if (!updated.getNumber().startsWith(requiredPrefix)) {
            throw new RuntimeException("Task number must start with " + requiredPrefix);
        }
        String suffix = updated.getNumber().substring(requiredPrefix.length());
        if (suffix.isEmpty()) {
            throw new RuntimeException("Task number suffix is required after " + requiredPrefix);
        }
        if (suffix.length() > 5) {
            throw new RuntimeException("Task number suffix must be at most 5 characters");
        }
        t.setNumber(updated.getNumber());

        if (updated.getBillingType() == Task.BillingType.UNIT) {
            if (updated.getUnitPrice() == null) {
                throw new RuntimeException("Unit price is required for UNIT billing");
            }
            if (updated.getUnitName() == null || updated.getUnitName().isBlank()) {
                throw new RuntimeException("Unit name is required for UNIT billing");
            }
            t.setBillingType(Task.BillingType.UNIT);
            t.setUnitPrice(updated.getUnitPrice());
            t.setUnitName(updated.getUnitName());
        } else {
            t.setBillingType(Task.BillingType.HOURLY);
            t.setUnitPrice(null);
            t.setUnitName(null);
        }

        Task saved = taskRepository.save(t);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
