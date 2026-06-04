package com.carbonexchange.tradingengine.domain.market.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a request to place an order in the exchange.
 *
 * @param courierId the ID of the user (courier) placing the order
 * @param type the type of order (BUY, SELL, or CLEAR_ALL)
 * @param executionMode the mode of execution (LIMIT or MARKET)
 * @param amount the number of carbon credits to trade
 * @param price the price per credit (ignored for market orders)
 * @param timestamp the time the order was placed
 */
public record OrderRequest(
        UUID courierId,
        OrderType type,
        ExecutionMode executionMode,
        BigDecimal amount,
        BigDecimal price,
        Instant timestamp
) {
    public enum OrderType { BUY, SELL, CLEAR_ALL }
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
