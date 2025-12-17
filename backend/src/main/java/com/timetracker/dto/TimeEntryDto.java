package com.timetracker.dto;

import com.timetracker.entity.TimeEntry;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeEntryDto {
    private Long id;

    @NotNull(message = "User ID is required")
    private Long userId;

    private Long projectId;

    private Long subprojectId;

    @NotNull(message = "Task ID is required")
    private Long taskId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    private BigDecimal totalHours;

    private BigDecimal quantity;

    private String description;
    private String status;
    private Long approvedBy;

    public static TimeEntryDto from(TimeEntry entry) {
        return TimeEntryDto.builder()
                .id(entry.getId())
                .userId(entry.getUserId())
                .projectId(entry.getProjectId())
                .subprojectId(entry.getSubprojectId())
                .taskId(entry.getTaskId())
                .date(entry.getDate())
                .totalHours(entry.getTotalHours())
                .quantity(entry.getQuantity())
                .description(entry.getDescription())
                .status(entry.getStatus().name())
                .approvedBy(entry.getApprovedBy())
                .build();
    }
}
