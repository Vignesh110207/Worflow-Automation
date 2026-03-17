package com.flowise.config;

import com.flowise.entity.User;
import com.flowise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUser("Admin User",     "admin@flowforge.com", "admin123", User.Role.admin);
        seedUser("Developer User", "dev@flowforge.com",   "dev123",   User.Role.developer);
        seedUser("Regular User",   "user@flowforge.com",  "user123",  User.Role.user);
        log.info("=================================================");
        log.info("  FlowForge Advanced is ready!");
        log.info("  Admin:     admin@flowforge.com / admin123");
        log.info("  Developer: dev@flowforge.com   / dev123");
        log.info("  User:      user@flowforge.com  / user123");
        log.info("=================================================");
    }

    private void seedUser(String name, String email, String password, User.Role role) {
        if (!userRepository.existsByEmail(email)) {
            userRepository.save(User.builder()
                    .name(name).email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .role(role).isActive(true)
                    .build());
            log.info("Created user: {}", email);
        }
    }
}
