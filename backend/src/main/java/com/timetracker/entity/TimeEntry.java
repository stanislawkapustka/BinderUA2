package com.timetracker.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "time_entries", indexes = {
    @Index(name = "idx_user_date", columnList = "user_id,date"),
    @Index(name = "idx_project_date", columnList = "project_id,date"),
    @Index(name = "idx_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "User ID is required")
    @Column(nullable = false)
    private Long userId;

    @NotNull(message = "Project ID is required")
    @Column(nullable = false)
    private Long projectId;

    @Column
    private Long subprojectId;

    @NotNull(message = "Date is required")
    @Column(nullable = false)
    private LocalDate date;

    @Column
    private LocalTime hoursFrom;

    @Column
    private LocalTime hoursTo;

    @NotNull(message = "Total hours is required")
    @Positive(message = "Total hours must be positive")
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal totalHours;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column
    private Long approvedBy;

    @Column
    private LocalDateTime approvedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = Status.ZGLOSZONY;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Status {
        ZGLOSZONY, ZATWIERDZONY, ODRZUCONY
    }
}
