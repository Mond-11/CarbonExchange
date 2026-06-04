package com.carbonexchange.tradingengine.domain.market.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a bid placed by a courier on the internal exchange.
 * * @param courierId The UUID of the courier (Van or E-Bike driver)
 * @param type BUY (needs credits for a route) or SELL (earned credits)
 * @param amount Number of carbon credits
 * @param price Per-credit price they are willing to pay/accept
 * @param timestamp Exact time of the order for latency calculations
 */
public record OrderRequest(
        UUID courierId,
        OrderType type,
        ExecutionMode executionMode,
        BigDecimal amount,
        BigDecimal price,
        Instant timestamp
) {
    public enum OrderType { BUY, SELL }
    public enum ExecutionMode { LIMIT, MARKET }

    /**
     * Compact constructor for OrderRequest with validation logic.
     * 
     * @param courierId the ID of the courier
     * @param type the type of the order (BUY/SELL)
     * @param price the price of the order
     * @param amount the amount of the order
     * @param timestamp the timestamp of the order
     */
    public OrderRequest {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
    }
}
