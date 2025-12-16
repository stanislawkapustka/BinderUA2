package com.timetracker.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import com.timetracker.repository.ProjectRepository;
import com.timetracker.repository.UserRepository;
import com.timetracker.entity.User;
import java.util.*;

@RestController
@RequestMapping("/api/projects/{projectId}/members")
@RequiredArgsConstructor
public class ProjectMemberController {

    private final JdbcTemplate jdbcTemplate;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<User>> getMembers(@PathVariable Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            return ResponseEntity.notFound().build();
        }
        List<Long> ids = jdbcTemplate.queryForList("select user_id from project_members where project_id = ?", Long.class, projectId);
        if (ids.isEmpty()) return ResponseEntity.ok(Collections.emptyList());
        List<User> users = new ArrayList<>();
        userRepository.findAllById(ids).forEach(users::add);
        return ResponseEntity.ok(users);
    }

    public static class MemberListPayload { public List<Long> userIds; }

    @PutMapping
    public ResponseEntity<Void> replaceMembers(@PathVariable Long projectId, @RequestBody MemberListPayload payload) {
        if (!projectRepository.existsById(projectId)) {
            return ResponseEntity.notFound().build();
        }
        // delete existing members
        jdbcTemplate.update("delete from project_members where project_id = ?", projectId);
        if (payload == null || payload.userIds == null || payload.userIds.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        // insert new members
        List<Object[]> rows = new ArrayList<>();
        for (Long uid : payload.userIds) {
            rows.add(new Object[] { projectId, uid });
        }
        jdbcTemplate.batchUpdate("insert into project_members (project_id, user_id) values (?,?)", rows);
        return ResponseEntity.noContent().build();
    }
}
