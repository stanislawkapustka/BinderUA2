package com.timetracker.dto;

import com.timetracker.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String role;
    private String contractType;

    @Positive(message = "UoP gross rate must be positive")
    private BigDecimal uopGrossRate;

    @Positive(message = "B2B hourly rate must be positive")
    private BigDecimal b2bHourlyNetRate;

    private String language;

    public static UserDto from(User user) {
        return UserDto.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .role(user.getRole().name())
            .contractType(user.getContractType().name())
            .uopGrossRate(user.getUopGrossRate())
            .b2bHourlyNetRate(user.getB2bHourlyNetRate())
            .language(user.getLanguage().name())
            .build();
    }
}
