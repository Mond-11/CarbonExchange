package com.carbonexchange.tradingengine.domain.market.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AccessLevel;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "executed_trades")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // Requires JPA, restricts manual empty creation
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID buyerId;

    @Column(nullable = false)
    private UUID sellerId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false)
    private Instant executedAt;

    public Trade(UUID buyerId, UUID sellerId, BigDecimal price, BigDecimal amount) {
        this.buyerId = buyerId;
        this.sellerId = sellerId;
        this.price = price;
        this.amount = amount;
        this.executedAt = Instant.now();
    }
}
