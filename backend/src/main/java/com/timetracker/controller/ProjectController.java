package com.timetracker.controller;

import com.timetracker.entity.Project;
import com.timetracker.repository.ProjectRepository;
import com.timetracker.repository.TaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProject(@PathVariable Long id) {
        return projectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        // if project set active true, ensure it will have tasks later (frontend should create tasks). Accept creation but ensure validation when activating via PUT
        Project saved = projectRepository.save(project);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @RequestBody Project updated) {
        return projectRepository.findById(id).map(p -> {
            p.setName(updated.getName());
            p.setNumber(updated.getNumber());
            p.setManagerMggp(updated.getManagerMggp());
            p.setManagerUaId(updated.getManagerUaId());
            p.setDescription(updated.getDescription());
            p.setManagerId(updated.getManagerId());
            p.setActive(updated.isActive());
            Project saved = projectRepository.save(p);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
