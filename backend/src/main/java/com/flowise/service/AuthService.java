package com.flowise.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowise.dto.DTOs.*;
import com.flowise.entity.User;
import com.flowise.exception.BadRequestException;
import com.flowise.exception.ResourceNotFoundException;
import com.flowise.repository.UserRepository;
import com.flowise.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;

    public ApiResponse<AuthResponse> login(LoginRequest req, String ip) {
        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadRequestException("Account is deactivated");
        }
        user.setLastLogin(LocalDateTime.now());
        userRepo.save(user);
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        auditService.log(user, "LOGIN", "auth", null, null, ip);
        return ApiResponse.ok("Login successful",
                new AuthResponse(token, toUserResponse(user)));
    }

    @Transactional
    public ApiResponse<AuthResponse> register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already registered");
        }
        // Security: All public registrations always get 'user' role only.
        // Admins and Developers must be assigned their roles by an existing admin.
        User.Role role = User.Role.user;

        User user = userRepo.save(User.builder()
                .name(req.getName()).email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(role).isActive(true).build());
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return ApiResponse.ok("Registration successful",
                new AuthResponse(token, toUserResponse(user)));
    }

    public ApiResponse<UserResponse> getMe(User user) {
        return ApiResponse.ok(toUserResponse(user));
    }

    public ApiResponse<PageData<UserResponse>> listUsers(int page, int size, String search) {
        PageRequest pr = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> result = search != null && !search.isBlank()
                ? userRepo.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(search, search, pr)
                : userRepo.findAll(pr);
        List<UserResponse> content = result.getContent().stream().map(this::toUserResponse).collect(Collectors.toList());
        return ApiResponse.ok(new PageData<>(content, page, size, result.getTotalElements(), result.getTotalPages()));
    }

    @Transactional
    public ApiResponse<UserResponse> updateUser(UUID id, UpdateUserRequest req, User actor) {
        User user = userRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (req.getName() != null)     user.setName(req.getName());
        if (req.getIsActive() != null) user.setIsActive(req.getIsActive());
        if (req.getRole() != null) {
            try { user.setRole(User.Role.valueOf(req.getRole())); }
            catch (IllegalArgumentException e) { throw new BadRequestException("Invalid role"); }
        }
        userRepo.save(user);
        auditService.log(actor, "UPDATE_USER", "user", user.getId(), user.getName(), null);
        return ApiResponse.ok("User updated", toUserResponse(user));
    }

    @Transactional
    public ApiResponse<Void> deleteUser(UUID id, User actor) {
        User user = userRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        auditService.log(actor, "DELETE_USER", "user", user.getId(), user.getName(), null);
        userRepo.deleteById(id);
        return ApiResponse.ok("User deleted", null);
    }

    public UserResponse toUserResponse(User u) {
        return UserResponse.builder()
                .id(u.getId()).name(u.getName()).email(u.getEmail())
                .role(u.getRole().name()).isActive(u.getIsActive())
                .lastLogin(u.getLastLogin()).createdAt(u.getCreatedAt())
                .build();
    }
}
