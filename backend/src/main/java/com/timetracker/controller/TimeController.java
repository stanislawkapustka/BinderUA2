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

/**
 * REST controller for time entry management operations.
 * Provides endpoints for creating, retrieving, approving/rejecting, updating, and deleting time entries.
 * Access control enforced via @PreAuthorize for management operations (approve/reject).
 */
@RestController
@RequestMapping("/api/time-entries")
@RequiredArgsConstructor
public class TimeController {

    private final TimeEntryService timeEntryService;

    /**
     * Create a new time entry for a project.
     *
     * @param dto Validated time entry data (projectId, date, hours, description)
     * @return Created time entry with ID and calculated totalHours
     */
    @PostMapping
    public ResponseEntity<TimeEntryDto> createEntry(@Valid @RequestBody TimeEntryDto dto) {
        return ResponseEntity.ok(timeEntryService.createEntry(dto));
    }

    /**
     * Retrieve time entries for current authenticated user.
     * Optional month/year filtering.
     *
     * @param month Optional month filter (1-12)
     * @param year Optional year filter (e.g., 2025)
     * @return List of user's time entries
     */
    @GetMapping
    public ResponseEntity<List<TimeEntryDto>> getEntries(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        // Get current user from security context
        return ResponseEntity.ok(timeEntryService.getCurrentUserEntries(month, year));
    }

    /**
     * Retrieve time entries for specific user and month.
     * Used by managers/directors to view employee entries.
     *
     * @param userId User ID whose entries to retrieve
     * @param year Year (e.g., 2025)
     * @param month Month (1-12)
     * @return List of time entries for specified user and period
     */
    @GetMapping("/user/{userId}/month/{year}/{month}")
    public ResponseEntity<List<TimeEntryDto>> getEntries(
            @PathVariable Long userId,
            @PathVariable int year,
            @PathVariable int month) {
        return ResponseEntity.ok(timeEntryService.getEntriesByUserAndMonth(userId, year, month));
    }

    /**
     * Retrieve paginated time entries for a specific user.
     *
     * @param userId User ID
     * @param pageable Pagination parameters (page, size, sort)
     * @return Page of time entries
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<TimeEntryDto>> getEntriesByUser(
            @PathVariable Long userId,
            Pageable pageable) {
        return ResponseEntity.ok(timeEntryService.getEntriesByUser(userId, pageable));
    }

    /**
     * Approve a time entry. Only accessible by MANAGER or DYREKTOR roles.
     * Sets status to ZATWIERDZONY and records approver ID.
     *
     * @param id Time entry ID to approve
     * @param approverId ID of approving user (manager/director)
     * @return Updated time entry with approved status
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('MANAGER') or hasRole('DYREKTOR')")
    public ResponseEntity<TimeEntryDto> approveEntry(
            @PathVariable Long id,
            @RequestParam Long approverId) {
        return ResponseEntity.ok(timeEntryService.approveEntry(id, approverId));
    }

    /**
     * Reject a time entry. Only accessible by MANAGER or DYREKTOR roles.
     * Sets status to ODRZUCONY.
     *
     * @param id Time entry ID to reject
     * @return Updated time entry with rejected status
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('MANAGER') or hasRole('DYREKTOR')")
    public ResponseEntity<TimeEntryDto> rejectEntry(@PathVariable Long id) {
        return ResponseEntity.ok(timeEntryService.rejectEntry(id));
    }

    /**
     * Update an existing time entry.
     * Only updates provided (non-null) fields.
     *
     * @param id Time entry ID to update
     * @param dto Fields to update
     * @return Updated time entry
     */
    @PutMapping("/{id}")
    public ResponseEntity<TimeEntryDto> updateEntry(
            @PathVariable Long id,
            @Valid @RequestBody TimeEntryDto dto) {
        return ResponseEntity.ok(timeEntryService.updateEntry(id, dto));
    }

    /**
     * Delete a time entry permanently.
     *
     * @param id Time entry ID to delete
     * @return 204 No Content on success
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id) {
        timeEntryService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }
}
