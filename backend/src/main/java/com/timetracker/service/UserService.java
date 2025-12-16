package com.timetracker.service;

import com.timetracker.dto.UserDto;
import com.timetracker.entity.User;
import com.timetracker.repository.UserRepository;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing user accounts including CRUD operations and password management.
 * Handles user creation with default temporary passwords, role assignment, and contract type configuration.
 * Enforces password complexity requirements and tracks password change requirements.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Retrieve all users with pagination support.
     *
     * @param pageable Pagination parameters (page number, size, sorting)
     * @return Page of user DTOs (passwords excluded)
     */
    public Page<UserDto> getAllUsers(@NonNull Pageable pageable) {
        return userRepository.findAll(pageable).map(UserDto::from);
    }

    /**
     * Retrieve single user by ID.
     *
     * @param id User ID to retrieve
     * @return User DTO (password excluded)
     * @throws RuntimeException if user not found
     */
    public UserDto getUserById(@NonNull Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserDto.from(user);
    }

    /**
     * Retrieve user by username (used for authentication).
     *
     * @param username Unique username
     * @return User DTO (password excluded)
     * @throws RuntimeException if user not found
     */
    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserDto.from(user);
    }

    /**
     * Create a new user account with BCrypt-hashed temporary password.
     * Sets passwordChangeRequired=true to force password change on first login.
     * Validates required fields and checks for duplicate username/email.
     *
     * @param userDto User data including username, email, name, role, contract details
     * @return Created user DTO with generated ID
     * @throws RuntimeException if validation fails or username/email already exists
     */
    @Transactional
    public UserDto createUser(UserDto userDto) {
        // Validate required fields
        if (userDto.getUsername() == null || userDto.getUsername().trim().isEmpty()) {
            throw new RuntimeException("Username is required");
        }
        if (userDto.getEmail() == null || userDto.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (userDto.getFirstName() == null || userDto.getFirstName().trim().isEmpty()) {
            throw new RuntimeException("First name is required");
        }
        if (userDto.getLastName() == null || userDto.getLastName().trim().isEmpty()) {
            throw new RuntimeException("Last name is required");
        }

        // Check if username or email already exists
        if (userRepository.findByUsername(userDto.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmail(userDto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Build user entity with BCrypt-hashed temporary password
        User user = User.builder()
                .username(userDto.getUsername())
                .email(userDto.getEmail())
                .firstName(userDto.getFirstName())
                .lastName(userDto.getLastName())
                .firstNameUa(userDto.getFirstNameUa())
                .lastNameUa(userDto.getLastNameUa())
                .password(passwordEncoder.encode("Temp2024!xY3")) // Temporary password
                .role(User.Role.valueOf(userDto.getRole() != null ? userDto.getRole() : "PRACOWNIK"))
                .contractType(User.ContractType.valueOf(userDto.getContractType() != null ? userDto.getContractType() : "UOP"))
                .language(User.Language.valueOf(userDto.getLanguage() != null ? userDto.getLanguage() : "PL"))
                .uopGrossRate(userDto.getUopGrossRate())
                .b2bHourlyNetRate(userDto.getB2bHourlyNetRate())
                .active(userDto.getActive() != null ? userDto.getActive() : true)
                .build();

        User savedUser = userRepository.save(user);
        return UserDto.from(savedUser);
    }

    /**
     * Update existing user account. Only updates non-null fields from DTO.
     * Does not modify password, createdAt, or ID fields.
     *
     * @param id User ID to update
     * @param userDto DTO with fields to update (null values ignored)
     * @return Updated user DTO
     * @throws RuntimeException if user not found
     */
    @Transactional
    public UserDto updateUser(@NonNull Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userDto.getEmail() != null) {
            user.setEmail(userDto.getEmail());
        }
        if (userDto.getFirstName() != null) {
            user.setFirstName(userDto.getFirstName());
        }
        if (userDto.getLastName() != null) {
            user.setLastName(userDto.getLastName());
        }
        if (userDto.getFirstNameUa() != null) {
            user.setFirstNameUa(userDto.getFirstNameUa());
        }
        if (userDto.getLastNameUa() != null) {
            user.setLastNameUa(userDto.getLastNameUa());
        }
        if (userDto.getRole() != null) {
            user.setRole(User.Role.valueOf(userDto.getRole()));
        }
        if (userDto.getContractType() != null) {
            user.setContractType(User.ContractType.valueOf(userDto.getContractType()));
        }
        if (userDto.getUopGrossRate() != null) {
            user.setUopGrossRate(userDto.getUopGrossRate());
        }
        if (userDto.getB2bHourlyNetRate() != null) {
            user.setB2bHourlyNetRate(userDto.getB2bHourlyNetRate());
        }
        if (userDto.getLanguage() != null) {
            user.setLanguage(User.Language.valueOf(userDto.getLanguage()));
        }
        if (userDto.getActive() != null) {
            user.setActive(userDto.getActive());
        }

        User savedUser = userRepository.save(user);
        return UserDto.from(savedUser);
    }

    /**
     * Delete user account permanently.
     * Consider using soft-delete (active=false) instead for audit trail preservation.
     *
     * @param id User ID to delete
     * @throws RuntimeException if user not found
     */
    @Transactional
    public void deleteUser(@NonNull Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }

    /**
     * Change password for currently authenticated user.
     * Validates old password, enforces complexity requirements, and clears passwordChangeRequired flag.
     * 
     * Password requirements:
     * - Minimum 8 characters
     * - At least one digit
     * - At least one letter
     * - At least one special character (!@#$%^&*())
     *
     * @param oldPassword Current password for verification
     * @param newPassword New password meeting complexity requirements
     * @throws RuntimeException if old password incorrect or new password doesn't meet requirements
     */
    @Transactional
    public void changePassword(@NonNull String oldPassword, @NonNull String newPassword) {
        // Get current user from security context
        org.springframework.security.core.Authentication authentication = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        // Validate new password strength
        if (newPassword.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters long");
        }
        if (!newPassword.matches(".*[0-9].*")) {
            throw new RuntimeException("Password must contain at least one digit");
        }
        if (!newPassword.matches(".*[a-zA-Z].*")) {
            throw new RuntimeException("Password must contain at least one letter");
        }
        if (!newPassword.matches(".*[!@#$%^&*()].*")) {
            throw new RuntimeException("Password must contain at least one special character (!@#$%^&*())");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordChangeRequired(false);
        userRepository.save(user);
    }
}
