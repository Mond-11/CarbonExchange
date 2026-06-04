package com.carbonexchange.tradingengine.domain.market.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents the persistent state of the order book in Kafka Streams state store.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderBookState {
    private List<OrderRequest> buyOrders = new ArrayList<>();
    private List<OrderRequest> sellOrders = new ArrayList<>();
    private BigDecimal lastTradedPrice = new BigDecimal("15.00");
}
