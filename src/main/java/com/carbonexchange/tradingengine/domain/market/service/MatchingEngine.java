package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.OrderBookSnapshot;
import com.carbonexchange.tradingengine.domain.market.model.OrderRequest;


public interface MatchingEngine {
    /**
     * Processes an incoming order and attempts to match it against the order book.
     */
    void processOrder(OrderRequest order);

    /**
     * Clears the current order book (useful for testing or end-of-day settlement).
     */
    void flushMarket();

    OrderBookSnapshot getOrderBookSnapshot();
}
