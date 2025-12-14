package com.timetracker.controller;

import com.timetracker.dto.TimeEntryDto;
import com.timetracker.service.TimeEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/time-entries")
@RequiredArgsConstructor
public class TimeController {

    private final TimeEntryService timeEntryService;

    @PostMapping
    public ResponseEntity<TimeEntryDto> createEntry(@Valid @RequestBody TimeEntryDto dto) {
        return ResponseEntity.ok(timeEntryService.createEntry(dto));
    }

    @GetMapping
    public ResponseEntity<List<TimeEntryDto>> getEntries(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        // Get current user from security context
        return ResponseEntity.ok(timeEntryService.getCurrentUserEntries(month, year));
    }

    @GetMapping("/user/{userId}/month/{year}/{month}")
    public ResponseEntity<List<TimeEntryDto>> getEntries(
            @PathVariable Long userId,
            @PathVariable int year,
            @PathVariable int month) {
        return ResponseEntity.ok(timeEntryService.getEntriesByUserAndMonth(userId, year, month));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<TimeEntryDto>> getEntriesByUser(
            @PathVariable Long userId,
            Pageable pageable) {
        return ResponseEntity.ok(timeEntryService.getEntriesByUser(userId, pageable));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('MANAGER') or hasRole('DYREKTOR')")
    public ResponseEntity<TimeEntryDto> approveEntry(
            @PathVariable Long id,
            @RequestParam Long approverId) {
        return ResponseEntity.ok(timeEntryService.approveEntry(id, approverId));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('MANAGER') or hasRole('DYREKTOR')")
    public ResponseEntity<TimeEntryDto> rejectEntry(@PathVariable Long id) {
        return ResponseEntity.ok(timeEntryService.rejectEntry(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TimeEntryDto> updateEntry(
            @PathVariable Long id,
            @Valid @RequestBody TimeEntryDto dto) {
        return ResponseEntity.ok(timeEntryService.updateEntry(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id) {
        timeEntryService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }
}
