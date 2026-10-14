package com.cafe.controller;

import com.cafe.dto.MessageResponse;
import com.cafe.dto.UserDtos.*;
import com.cafe.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse signup(@Valid @RequestBody SignupRequest req) {
        userService.signup(req);
        return new MessageResponse("Successfully registered. Please wait for admin approval.");
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return userService.login(req);
    }

    @PostMapping("/forgotPassword")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        userService.forgotPassword(req);
        return new MessageResponse("If that email is registered, a temporary password has been sent to it.");
    }

    /** Lets the frontend check whether its stored token is still valid. */
    @GetMapping("/checkToken")
    public MessageResponse checkToken() {
        return new MessageResponse("true");
    }

    @GetMapping("/me")
    public UserResponse me() {
        return userService.me();
    }

    @PostMapping("/changePassword")
    public MessageResponse changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        userService.changePassword(req);
        return new MessageResponse("Password updated successfully.");
    }

    @GetMapping("/get")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getAll() {
        return userService.getAllUsers();
    }

    @PostMapping("/update")
    @PreAuthorize("hasRole('ADMIN')")
    public MessageResponse updateStatus(@Valid @RequestBody UpdateStatusRequest req) {
        userService.updateStatus(req);
        return new MessageResponse("User status updated successfully.");
    }
}
