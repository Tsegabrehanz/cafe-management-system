package com.cafe.dto;

import com.cafe.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request/response shapes for the /user API. */
public final class UserDtos {

    private UserDtos() { }

    public record SignupRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Pattern(regexp = "^[0-9+\\- ]{6,20}$", message = "must be a valid phone number")
            String contactNumber,
            @NotBlank @Email @Size(max = 150) String email,
            @NotBlank @Size(min = 6, max = 100) String password) { }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) { }

    public record LoginResponse(String token, String role, String name) { }

    public record ForgotPasswordRequest(@NotBlank @Email String email) { }

    public record ChangePasswordRequest(
            @NotBlank String oldPassword,
            @NotBlank @Size(min = 6, max = 100) String newPassword) { }

    public record UpdateStatusRequest(@NotNull Long id, @NotNull Boolean status) { }

    public record UserResponse(Long id, String name, String email, String contactNumber,
                               boolean status, String role) {
        public static UserResponse of(User u) {
            return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getContactNumber(),
                    u.isStatus(), u.getRole().name().toLowerCase());
        }
    }
}
