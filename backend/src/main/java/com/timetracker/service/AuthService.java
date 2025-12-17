package com.timetracker.service;

import com.timetracker.dto.AuthRequest;
import com.timetracker.dto.AuthResponse;
import com.timetracker.dto.UserDto;
import com.timetracker.entity.User;
import com.timetracker.repository.UserRepository;
import com.timetracker.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service handling authentication operations including login and registration.
 * Validates credentials, checks account status, generates JWT tokens,
 * and creates new user accounts with default settings.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * Authenticate user and generate JWT token.
     * Validates credentials using BCrypt, checks account active status,
     * and includes user role and language in JWT claims.
     *
     * @param request Login request containing username and password
     * @return Authentication response with JWT token, expiration, and user details
     * @throws RuntimeException if user not found, account inactive, or invalid
     *                          credentials
     */
    @Transactional
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        log.info("Login attempt for user: {}", request.getUsername());

        // Check if user account is active (soft-delete check)
        if (!user.getActive()) {
            throw new RuntimeException("User account is deactivated");
        }

        // Verify password using BCrypt
        log.debug("Stored hash: {}", user.getPassword());
        log.debug("Provided password: {}", request.getPassword());
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        log.debug("Password match result: {}", matches);

        if (!matches) {
            log.error("Password mismatch for user: {}", request.getUsername());
            throw new RuntimeException("Invalid credentials");
        }

        // Generate JWT token with user role and language embedded in claims
        String token = jwtUtil.generateToken(
                user.getUsername(),
                user.getRole().name(),
                user.getLanguage().name());

        return AuthResponse.builder()
                .token(token)
                .expiresAt(System.currentTimeMillis() + jwtUtil.getExpirationMs())
                .role(user.getRole().name())
                .language(user.getLanguage().name())
                .username(user.getUsername())
                .user(UserDto.from(user))
                .build();
    }

    /**
     * Register a new user account with default password.
     * Checks for duplicate username/email before creation.
     * Sets default role to PRACOWNIK and contract type to UOP if not specified.
     *
     * @param userDto User registration data
     * @return Created user DTO (password excluded)
     * @throws RuntimeException if username or email already exists
     */
    @Transactional
    public UserDto register(UserDto userDto) {
        if (userRepository.existsByUsername(userDto.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .username(userDto.getUsername())
                .email(userDto.getEmail())
                .firstName(userDto.getFirstName())
                .lastName(userDto.getLastName())
                .password(passwordEncoder.encode("defaultPassword123"))
                .role(User.Role.valueOf(userDto.getRole() != null ? userDto.getRole() : "PRACOWNIK"))
                .contractType(User.ContractType
                        .valueOf(userDto.getContractType() != null ? userDto.getContractType() : "UOP"))
                .uopGrossRate(userDto.getUopGrossRate())
                .b2bHourlyNetRate(userDto.getB2bHourlyNetRate())
                .language(User.Language.valueOf(userDto.getLanguage() != null ? userDto.getLanguage() : "PL"))
                .build();

        User savedUser = userRepository.save(user);
        return UserDto.from(savedUser);
    }
}
