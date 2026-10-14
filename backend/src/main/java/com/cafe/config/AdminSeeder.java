package com.cafe.config;

import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** Creates the first admin account on startup if no admin exists yet. */
@Component
@Order(1)
public class AdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String name;

    public AdminSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       @Value("${app.admin.email}") String email,
                       @Value("${app.admin.password}") String password,
                       @Value("${app.admin.name:Admin}") String name) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
        this.name = name;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.findAllByRoleOrderByNameAsc(Role.ADMIN).isEmpty()) return;
        User admin = new User();
        admin.setName(name);
        admin.setEmail(email.toLowerCase());
        admin.setContactNumber("0000000000");
        admin.setPassword(passwordEncoder.encode(password));
        admin.setStatus(true);
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
        log.warn("Created initial admin account '{}'. Change its password after first login.", admin.getEmail());
    }
}
