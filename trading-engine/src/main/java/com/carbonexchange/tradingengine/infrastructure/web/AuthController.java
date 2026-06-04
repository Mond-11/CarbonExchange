package com.carbonexchange.tradingengine.infrastructure.web;

import com.carbonexchange.tradingengine.domain.user.model.User;
import com.carbonexchange.tradingengine.domain.user.service.UserService;
import com.carbonexchange.tradingengine.infrastructure.web.dto.LoginRequest;
import com.carbonexchange.tradingengine.infrastructure.web.dto.RegisterRequest;
import com.carbonexchange.tradingengine.infrastructure.web.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody RegisterRequest request) {
        User user = userService.register(request.username(), request.password());
        return ResponseEntity.ok(toResponse(user));
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@RequestBody LoginRequest request) {
        return userService.findByUsername(request.username())
                .filter(user -> passwordEncoder.matches(request.password(), user.getPassword()))
                .map(user -> ResponseEntity.ok(toResponse(user)))
                .orElse(ResponseEntity.status(401).build());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.findAll().stream().map(this::toResponse).toList());
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID id) {
        return userService.findById(id)
                .map(user -> ResponseEntity.ok(toResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getMoneyBalance(), user.getCreditBalance());
    }
}
