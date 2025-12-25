# Spec: Implement Detailed Audit Logging for Administrative Actions

## 1. Overview

This track focuses on creating a comprehensive audit logging system to record all significant administrative actions within the BinderUA application. This will enhance security, accountability, and traceability for actions performed by users with elevated privileges (MANAGER, DYREKTOR).

## 2. Functional Requirements

### 2.1. Audited Actions

The following administrative actions must be logged:

*   **User Management (by DYREKTOR):**
    *   User registration (`POST /api/auth/register`)
    *   User update (`PUT /api/users/{id}`)
    *   User deletion (`DELETE /api/users/{id}`)
*   **Time Entry Management (by MANAGER/DYREKTOR):**
    *   Time entry approval (`PUT /api/time-entries/{id}/approve`)
    *   Time entry rejection (`PUT /api/time-entries/{id}/reject`)
*   **Project Management (by MANAGER/DYREKTOR):**
    *   Project creation/update
    *   Assigning/removing project members

### 2.2. Logged Information

Each audit log entry must contain the following information:

*   **`id`**: Unique identifier for the log entry.
*   **`timestamp`**: The exact date and time the action occurred (UTC).
*   **`performingUserId`**: The ID of the user who performed the action.
*   **`performingUsername`**: The username of the user who performed the action.
*   **`actionType`**: A clear, human-readable description of the action (e.g., "USER_UPDATE", "TIME_ENTRY_APPROVE").
*   **`targetEntity`**: The type of entity that was affected (e.g., "User", "TimeEntry", "Project").
*   **`targetEntityId`**: The ID of the affected entity.
*   **`details`**: A JSON object containing relevant details about the change (e.g., for a user update, this could include the fields that were changed and their old/new values).

## 3. Technical Requirements

### 3.1. Backend

*   **Audit Log Entity:** Create a new JPA entity `AuditLog` that maps to a `audit_logs` table in the database.
*   **Audit Service:** Implement an `AuditService` responsible for creating and saving audit log entries.
*   **AOP for Auditing:** Use Aspect-Oriented Programming (AOP) with a custom annotation (e.g., `@Auditable`) to intercept method calls in the controllers or services that correspond to the audited actions. The aspect will be responsible for gathering the required information and calling the `AuditService`.
*   **Database Migration:** Create a new Flyway migration script to create the `audit_logs` table.

### 3.2. Frontend (Optional - for a future track)

*   A new page for DYREKTORs to view and filter the audit logs is out of scope for this track but should be considered for future development.

## 4. Non-Functional Requirements

*   **Performance:** The audit logging mechanism should have a minimal performance impact on the execution of the audited actions. The process should be asynchronous if possible.
*   **Security:** Only users with the DYREKTOR role should be able to potentially view audit logs in the future. The logging mechanism itself should be secure from tampering.

## 5. Out of Scope

*   Displaying audit logs in the frontend UI.
*   Creating alerts or notifications based on audit log entries.
