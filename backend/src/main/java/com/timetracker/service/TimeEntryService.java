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
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimeEntryService {

    private final TimeEntryRepository timeEntryRepository;
    private final UserRepository userRepository;

    @Transactional
    public TimeEntryDto createEntry(TimeEntryDto dto) {
        TimeEntry entry = TimeEntry.builder()
                .userId(dto.getUserId())
                .projectId(dto.getProjectId())
                .subprojectId(dto.getSubprojectId())
                .date(dto.getDate())
                .hoursFrom(dto.getHoursFrom())
                .hoursTo(dto.getHoursTo())
                .totalHours(calculateTotalHours(dto))
                .description(dto.getDescription())
                .status(TimeEntry.Status.ZGLOSZONY)
                .build();

        TimeEntry savedEntry = timeEntryRepository.save(entry);
        return TimeEntryDto.from(savedEntry);
    }

    private BigDecimal calculateTotalHours(TimeEntryDto dto) {
        if (dto.getTotalHours() != null) {
            return dto.getTotalHours();
        }
        
        if (dto.getHoursFrom() != null && dto.getHoursTo() != null) {
            Duration duration = Duration.between(dto.getHoursFrom(), dto.getHoursTo());
            long minutes = duration.toMinutes();
            return BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        }
        
        return BigDecimal.ZERO;
    }

    public List<TimeEntryDto> getEntriesByUserAndMonth(Long userId, int year, int month) {
        return timeEntryRepository.findByUserIdAndYearAndMonth(userId, year, month)
                .stream()
                .map(TimeEntryDto::from)
                .collect(Collectors.toList());
    }

    public Page<TimeEntryDto> getEntriesByUser(Long userId, Pageable pageable) {
        return timeEntryRepository.findByUserId(userId, pageable)
                .map(TimeEntryDto::from);
    }

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

    @Transactional
    public TimeEntryDto rejectEntry(Long id) {
        TimeEntry entry = timeEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Time entry not found"));

        entry.setStatus(TimeEntry.Status.ODRZUCONY);
        entry = timeEntryRepository.save(entry);
        return TimeEntryDto.from(entry);
    }

    @Transactional
    public void deleteEntry(Long id) {
        if (!timeEntryRepository.existsById(id)) {
            throw new RuntimeException("Time entry not found");
        }
        timeEntryRepository.deleteById(id);
    }

    public List<TimeEntryDto> getCurrentUserEntries(Integer month, Integer year) {
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

    @Transactional
    public TimeEntryDto updateEntry(Long id, TimeEntryDto dto) {
        TimeEntry entry = timeEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Time entry not found"));
        
        if (dto.getHoursFrom() != null) entry.setHoursFrom(dto.getHoursFrom());
        if (dto.getHoursTo() != null) entry.setHoursTo(dto.getHoursTo());
        if (dto.getTotalHours() != null) entry.setTotalHours(dto.getTotalHours());
        if (dto.getDescription() != null) entry.setDescription(dto.getDescription());
        
        entry = timeEntryRepository.save(entry);
        return TimeEntryDto.from(entry);
    }
}
