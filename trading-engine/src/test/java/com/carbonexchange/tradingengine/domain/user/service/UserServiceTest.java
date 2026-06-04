package com.carbonexchange.tradingengine.domain.user.service;

import com.carbonexchange.tradingengine.domain.user.model.User;
import com.carbonexchange.tradingengine.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = {"incoming-orders", "trades", "orderbook-snapshots"})
@ActiveProfiles("test")
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void shouldRegisterUser() {
        User user = userService.register("testuser", "password");
        assertThat(user.getId()).isNotNull();
        assertThat(user.getUsername()).isEqualTo("testuser");
        assertThat(passwordEncoder.matches("password", user.getPassword())).isTrue();
        assertThat(user.getMoneyBalance()).isEqualByComparingTo("10000.00");
        assertThat(user.getCreditBalance()).isEqualByComparingTo("100.00");
    }

    @Test
    void shouldUpdateBalances() {
        User user = userService.register("testuser", "password");
        UUID userId = user.getId();

        userService.updateBalances(userId, new BigDecimal("50.50"), new BigDecimal("-10.0"));

        Optional<User> updatedUser = userService.findById(userId);
        assertThat(updatedUser).isPresent();
        assertThat(updatedUser.get().getMoneyBalance()).isEqualByComparingTo("10050.50");
        assertThat(updatedUser.get().getCreditBalance()).isEqualByComparingTo("90.0");
    }

    @Test
    void shouldAllowNegativeBalances() {
        User user = userService.register("testuser", "password");
        UUID userId = user.getId();

        userService.updateBalances(userId, new BigDecimal("-20000.00"), new BigDecimal("-500.0"));

        Optional<User> updatedUser = userService.findById(userId);
        assertThat(updatedUser).isPresent();
        assertThat(updatedUser.get().getMoneyBalance()).isEqualByComparingTo("-10000.00");
        assertThat(updatedUser.get().getCreditBalance()).isEqualByComparingTo("-400.0");
    }

    @Test
    void shouldSeedUsers() {
        userService.seedUsers();
        assertThat(userRepository.count()).isEqualTo(10);
        assertThat(userRepository.findByUsername("user1")).isPresent();
        assertThat(userRepository.findByUsername("user10")).isPresent();
    }
}
