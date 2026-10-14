package com.cafe.service;

import com.cafe.dto.UserDtos.*;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.exception.ApiException;
import com.cafe.repository.UserRepository;
import com.cafe.security.CurrentUser;
import com.cafe.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private static final String TEMP_PW_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtService jwtService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @Transactional
    public void signup(SignupRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Email already exists.");
        }
        User user = new User();
        user.setName(req.name().trim());
        user.setContactNumber(req.contactNumber().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setStatus(false);           // must be approved by an admin
        user.setRole(Role.USER);
        userRepository.save(user);
    }

    public LoginResponse login(LoginRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email().trim(), req.password()));
        } catch (DisabledException e) {
            throw ApiException.unauthorized("Wait for admin approval.");
        } catch (BadCredentialsException e) {
            throw ApiException.unauthorized("Incorrect email or password.");
        } catch (AuthenticationException e) {
            throw ApiException.unauthorized("Incorrect email or password.");
        }
        User user = userRepository.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> ApiException.unauthorized("Incorrect email or password."));
        String role = user.getRole().name().toLowerCase();
        return new LoginResponse(jwtService.generateToken(user.getEmail(), role), role, user.getName());
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAllByRoleOrderByNameAsc(Role.USER).stream().map(UserResponse::of).toList();
    }

    public UserResponse me() {
        return userRepository.findByEmailIgnoreCase(CurrentUser.email())
                .map(UserResponse::of)
                .orElseThrow(() -> ApiException.notFound("User not found."));
    }

    /** Admin approves or disables a user; all admins are notified, as in the original design. */
    @Transactional
    public void updateStatus(UpdateStatusRequest req) {
        User user = userRepository.findById(req.id())
                .orElseThrow(() -> ApiException.notFound("User id does not exist."));
        if (user.getRole() == Role.ADMIN) {
            throw ApiException.badRequest("Admin accounts cannot be changed here.");
        }
        user.setStatus(req.status());
        userRepository.save(user);

        List<String> admins = userRepository.findAllByRoleOrderByNameAsc(Role.ADMIN).stream()
                .map(User::getEmail).toList();
        String action = req.status() ? "approved" : "disabled";
        emailService.sendToAdmins(admins, "Account " + (req.status() ? "Approved" : "Disabled"),
                "USER: " + user.getEmail() + " is " + action + " by ADMIN: " + CurrentUser.email() + ".");
    }

    @Transactional
    public void changePassword(ChangePasswordRequest req) {
        User user = userRepository.findByEmailIgnoreCase(CurrentUser.email())
                .orElseThrow(() -> ApiException.notFound("User not found."));
        if (!passwordEncoder.matches(req.oldPassword(), user.getPassword())) {
            throw ApiException.badRequest("Incorrect old password.");
        }
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
    }

    /**
     * Resets the password to a random temporary one and emails it. Passwords are stored
     * hashed, so the old one can never be emailed back. The response is identical whether
     * or not the email exists, so this endpoint can't be used to discover accounts.
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest req) {
        userRepository.findByEmailIgnoreCase(req.email().trim()).ifPresent(user -> {
            String temp = randomPassword(10);
            user.setPassword(passwordEncoder.encode(temp));
            userRepository.save(user);
            emailService.sendTemporaryPassword(user.getEmail(), temp);
            log.info("Temporary password issued for {}", user.getEmail());
        });
    }

    private static String randomPassword(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) sb.append(TEMP_PW_CHARS.charAt(RANDOM.nextInt(TEMP_PW_CHARS.length())));
        return sb.toString();
    }
}
