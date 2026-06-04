package com.carbonexchange.tradingengine.domain.user.service;

import com.carbonexchange.tradingengine.domain.user.model.User;
import com.carbonexchange.tradingengine.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing user accounts, authentication, and balances.
 */
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Registers a new user with initial balances.
     * 
     * @param username the username
     * @param password the raw password (will be encoded)
     * @return the created user
     */
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

    /**
     * Updates money and credit balances for a specific user.
     * 
     * @param userId the ID of the user
     * @param moneyDelta the amount of money to add (negative to deduct)
     * @param creditDelta the amount of credits to add (negative to deduct)
     */
    @Transactional
    public void updateBalances(UUID userId, BigDecimal moneyDelta, BigDecimal creditDelta) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setMoneyBalance(user.getMoneyBalance().add(moneyDelta));
            user.setCreditBalance(user.getCreditBalance().add(creditDelta));
            userRepository.save(user);
        });
    }
}
