package com.timetracker.dto;

import com.timetracker.entity.TimeEntry;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeEntryDto {
    private Long id;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Project ID is required")
    private Long projectId;

    private Long subprojectId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    private LocalTime hoursFrom;
    private LocalTime hoursTo;

    @NotNull(message = "Total hours is required")
    @Positive(message = "Total hours must be positive")
    private BigDecimal totalHours;

    private String description;
    private String status;
    private Long approvedBy;

    public static TimeEntryDto from(TimeEntry entry) {
        return TimeEntryDto.builder()
            .id(entry.getId())
            .userId(entry.getUserId())
            .projectId(entry.getProjectId())
            .subprojectId(entry.getSubprojectId())
            .date(entry.getDate())
            .hoursFrom(entry.getHoursFrom())
            .hoursTo(entry.getHoursTo())
            .totalHours(entry.getTotalHours())
            .description(entry.getDescription())
            .status(entry.getStatus().name())
            .approvedBy(entry.getApprovedBy())
            .build();
    }
}
