package com.timetracker.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "projects", indexes = {
        @Index(name = "idx_manager_id", columnList = "manager_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Project name is required")
    @Column(nullable = false, length = 255)
    private String name;

    @NotBlank(message = "Project number is required")
    @Column(name = "number", nullable = false, length = 12)
    private String number;

    @Column(name = "manager_mggp", length = 30)
    private String managerMggp;

    @Column(name = "manager_ua_id")
    private Long managerUaId;

    @Column(length = 1000)
    private String description;

    @Column(name = "manager_id", nullable = false)
    private Long managerId;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
