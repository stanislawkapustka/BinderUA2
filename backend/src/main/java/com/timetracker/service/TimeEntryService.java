package com.timetracker.service;

import com.timetracker.dto.TimeEntryDto;
import com.timetracker.entity.TimeEntry;
import com.timetracker.entity.User;
import com.timetracker.repository.TimeEntryRepository;
import com.timetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service handling time entry operations including creation,
 * approval/rejection, and retrieval.
 * Enforces business rules such as automatic hour calculation from time ranges,
 * status management (ZGLOSZONY/ZATWIERDZONY/ODRZUCONY), and audit trail
 * tracking.
 */
@Service
@RequiredArgsConstructor
public class TimeEntryService {

    private final TimeEntryRepository timeEntryRepository;
    private final UserRepository userRepository;

    /**
     * Create a new time entry associated with a task.
     * For HOURLY tasks: totalHours is required.
     * For UNIT tasks: quantity is required.
     * Sets initial status to ZGLOSZONY (submitted).
     *
     * @param dto Time entry data transfer object containing entry details
     * @return Created time entry with generated ID
     */
    @Transactional
    public TimeEntryDto createEntry(TimeEntryDto dto) {
        TimeEntry entry = TimeEntry.builder()
                .userId(dto.getUserId())
                .projectId(dto.getProjectId())
                .taskId(dto.getTaskId())
                .date(dto.getDate())
                .totalHours(dto.getTotalHours())
                .quantity(dto.getQuantity())
                .description(dto.getDescription())
                .status(TimeEntry.Status.ZGLOSZONY)
                .build();

        TimeEntry savedEntry = timeEntryRepository.save(entry);
        return TimeEntryDto.from(savedEntry);
    }

    /**
     * Retrieve all time entries for a specific user and month.
     *
     * @param userId ID of the user whose entries to retrieve
     * @param year   Year of entries (e.g., 2025)
     * @param month  Month of entries (1-12)
     * @return List of time entry DTOs for the specified period
     */
    public List<TimeEntryDto> getEntriesByUserAndMonth(Long userId, int year, int month) {
        return timeEntryRepository.findByUserIdAndYearAndMonth(userId, year, month)
                .stream()
                .map(TimeEntryDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Retrieve paginated time entries for a specific user.
     *
     * @param userId   ID of the user whose entries to retrieve
     * @param pageable Pagination parameters (page number, size, sorting)
     * @return Page of time entry DTOs
     */
    public Page<TimeEntryDto> getEntriesByUser(Long userId, Pageable pageable) {
        return timeEntryRepository.findByUserId(userId, pageable)
                .map(TimeEntryDto::from);
    }

    /**
     * Approve a time entry. Only MANAGER or DYREKTOR roles can call this (enforced
     * at controller level).
     * Sets status to ZATWIERDZONY (approved), records approver ID and approval
     * timestamp.
     *
     * @param id         Entry ID to approve
     * @param approverId ID of user performing approval (MANAGER or DYREKTOR)
     * @return Updated time entry DTO with ZATWIERDZONY status
     * @throws RuntimeException if entry not found
     */
    @Transactional
    public TimeEntryDto approveEntry(Long id, Long approverId) {
        TimeEntry entry = timeEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Time entry not found"));

        entry.setStatus(TimeEntry.Status.ZATWIERDZONY);
        entry.setApprovedBy(approverId);
        entry.setApprovedAt(LocalDateTime.now());

        entry = timeEntryRepository.save(entry);
        return TimeEntryDto.from(entry);
    }

    /**
     * Reject a time entry. Only MANAGER or DYREKTOR roles can call this (enforced
     * at controller level).
     * Sets status to ODRZUCONY (rejected) without recording approval details.
     *
     * @param id Entry ID to reject
     * @return Updated time entry DTO with ODRZUCONY status
     * @throws RuntimeException if entry not found
     */
    @Transactional
    public TimeEntryDto rejectEntry(Long id) {
        TimeEntry entry = timeEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Time entry not found"));

        entry.setStatus(TimeEntry.Status.ODRZUCONY);
        entry = timeEntryRepository.save(entry);
        return TimeEntryDto.from(entry);
    }

    /**
     * Delete a time entry permanently.
     *
     * @param id Entry ID to delete
     * @throws RuntimeException if entry not found
     */
    @Transactional
    public void deleteEntry(Long id) {
        if (!timeEntryRepository.existsById(id)) {
            throw new RuntimeException("Time entry not found");
        }
        timeEntryRepository.deleteById(id);
    }

    /**
     * Retrieve time entries for the currently authenticated user.
     * Extracts username from SecurityContext, looks up user, and returns their
     * entries.
     * If month/year provided, filters to that period; otherwise returns all
     * entries.
     *
     * @param month Optional month filter (1-12)
     * @param year  Optional year filter (e.g., 2025)
     * @return List of time entry DTOs for current user
     * @throws RuntimeException if authenticated user not found in database
     */
    public List<TimeEntryDto> getCurrentUserEntries(Integer month, Integer year) {
        // Extract authenticated username from Spring Security context
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (month != null && year != null) {
            return getEntriesByUserAndMonth(user.getId(), year, month);
        }

        // Return all entries for current user if no month/year specified
        return timeEntryRepository.findByUserId(user.getId())
                .stream()
                .map(TimeEntryDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Update an existing time entry. Only updates non-null fields from DTO.
     * Does not modify status, approval information, or taskId.
     *
     * @param id  Entry ID to update
     * @param dto DTO containing fields to update (null values ignored)
     * @return Updated time entry DTO
     * @throws RuntimeException if entry not found
     */
    @Transactional
    public TimeEntryDto updateEntry(Long id, TimeEntryDto dto) {
        TimeEntry entry = timeEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Time entry not found"));

        if (dto.getTotalHours() != null)
            entry.setTotalHours(dto.getTotalHours());
        if (dto.getQuantity() != null)
            entry.setQuantity(dto.getQuantity());
        if (dto.getDescription() != null)
            entry.setDescription(dto.getDescription());

        entry = timeEntryRepository.save(entry);
        return TimeEntryDto.from(entry);
    }
}