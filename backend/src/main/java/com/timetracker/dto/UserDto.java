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

    private String firstName;
    private String lastName;
    private String firstNameUa;
    private String lastNameUa;

    private String role;
    private String contractType;

    private BigDecimal uopGrossRate;
    private BigDecimal b2bHourlyNetRate;

    private String language;
    private Boolean active;
    private Boolean passwordChangeRequired;

    public static UserDto from(User user) {
        return UserDto.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .firstNameUa(user.getFirstNameUa())
            .lastNameUa(user.getLastNameUa())
            .role(user.getRole().name())
            .contractType(user.getContractType().name())
            .uopGrossRate(user.getUopGrossRate())
            .b2bHourlyNetRate(user.getB2bHourlyNetRate())
            .language(user.getLanguage().name())
            .active(user.getActive())
            .passwordChangeRequired(user.getPasswordChangeRequired())
            .build();
    }
}
