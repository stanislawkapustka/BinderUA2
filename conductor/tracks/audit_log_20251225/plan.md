# Plan: Implement Detailed Audit Logging for Administrative Actions

This plan outlines the steps to implement a detailed audit logging system for administrative actions in the BinderUA application.

---

## Phase 1: Backend Setup for Audit Logging [checkpoint: ]

- [ ] Task: Create Flyway migration script for the `audit_logs` table.
- [ ] Task: Create the `AuditLog` JPA entity.
- [ ] Task: Create the `AuditLogRepository`.
- [ ] Task: Create the `AuditService` with a method to create and save log entries.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Backend Setup for Audit Logging' (Protocol in workflow.md)

## Phase 2: Implement Auditing for User Management [checkpoint: ]

- [ ] Task: Write Tests - Create an AOP annotation `@Auditable`.
- [ ] Task: Implement Feature - Create the `AuditAspect` to intercept methods annotated with `@Auditable`.
- [ ] Task: Write Tests - Test auditing for user registration (`POST /api/auth/register`).
- [ ] Task: Implement Feature - Apply `@Auditable` annotation to the user registration method.
- [ ] Task: Write Tests - Test auditing for user update (`PUT /api/users/{id}`).
- [ ] Task: Implement Feature - Apply `@Auditable` annotation to the user update method.
- [ ] Task: Write Tests - Test auditing for user deletion (`DELETE /api/users/{id}`).
- [ ] Task: Implement Feature - Apply `@Auditable` annotation to the user deletion method.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Implement Auditing for User Management' (Protocol in workflow.md)

## Phase 3: Implement Auditing for Time Entry and Project Management [checkpoint: ]

- [ ] Task: Write Tests - Test auditing for time entry approval (`PUT /api/time-entries/{id}/approve`).
- [ ] Task: Implement Feature - Apply `@Auditable` annotation to the time entry approval method.
- [ ] Task: Write Tests - Test auditing for time entry rejection (`PUT /api/time-entries/{id}/reject`).
- [ ] Task: Implement Feature - Apply `@Auditable` annotation to the time entry rejection method.
- [ ] Task: Write Tests - Test auditing for project creation/update actions.
- [ ] Task: Implement Feature - Apply `@Auditable` annotation to project creation/update methods.
- [ ] Task: Write Tests - Test auditing for project member assignment/removal.
- [ ] Task: Implement Feature - Apply `@Auditable` annotation to project member assignment/removal methods.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Implement Auditing for Time Entry and Project Management' (Protocol in workflow.md)
