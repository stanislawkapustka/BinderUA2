package com.timetracker.service;

import com.timetracker.dto.UserDto;
import com.timetracker.entity.User;
import com.timetracker.repository.UserRepository;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public Page<UserDto> getAllUsers(@NonNull Pageable pageable) {
        return userRepository.findAll(pageable).map(UserDto::from);
    }

    public UserDto getUserById(@NonNull Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserDto.from(user);
    }

    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserDto.from(user);
    }

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

        User savedUser = userRepository.save(user);
        return UserDto.from(savedUser);
    }

    @Transactional
    public void deleteUser(@NonNull Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }
}
