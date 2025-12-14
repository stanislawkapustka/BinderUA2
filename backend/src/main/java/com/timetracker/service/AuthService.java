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

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        log.info("Login attempt for user: {}", request.getUsername());
        log.info("Password from request: {}", request.getPassword());
        log.info("Stored hash: {}", user.getPassword());
        
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        log.info("Password matches: {}", matches);
        
        if (!matches) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(
                user.getUsername(),
                user.getRole().name(),
                user.getLanguage().name()
        );

        return AuthResponse.builder()
                .token(token)
                .expiresAt(System.currentTimeMillis() + jwtUtil.getExpirationMs())
                .role(user.getRole().name())
                .language(user.getLanguage().name())
                .username(user.getUsername())
                .user(UserDto.from(user))
                .build();
    }

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
                .contractType(User.ContractType.valueOf(userDto.getContractType() != null ? userDto.getContractType() : "UOP"))
                .uopGrossRate(userDto.getUopGrossRate())
                .b2bHourlyNetRate(userDto.getB2bHourlyNetRate())
                .language(User.Language.valueOf(userDto.getLanguage() != null ? userDto.getLanguage() : "PL"))
                .build();

        User savedUser = userRepository.save(user);
        return UserDto.from(savedUser);
    }
}
