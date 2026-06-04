package com.carbonexchange.tradingengine.domain.user.service;

import com.carbonexchange.tradingengine.domain.user.model.User;
import com.carbonexchange.tradingengine.domain.user.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User register(String username, String password) {
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .moneyBalance(new BigDecimal("10000.00"))
                .creditBalance(new BigDecimal("100.00"))
                .build();
        return userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Transactional
    public void updateBalances(UUID userId, BigDecimal moneyDelta, BigDecimal creditDelta) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setMoneyBalance(user.getMoneyBalance().add(moneyDelta));
            user.setCreditBalance(user.getCreditBalance().add(creditDelta));
            userRepository.save(user);
        });
    }

    @PostConstruct
    public void seedUsers() {
        if (userRepository.count() == 0) {
            for (int i = 1; i <= 10; i++) {
                String username = "user" + i;
                register(username, "password" + i);
            }
        }
    }
}
