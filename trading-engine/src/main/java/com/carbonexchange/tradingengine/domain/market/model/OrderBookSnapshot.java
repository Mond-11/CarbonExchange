package com.carbonexchange.tradingengine.domain.market.model;

import java.util.List;

/**
 * A snapshot of the current order book state, containing lists of buy and sell orders.
 * 
 * @param buyOrders the current list of buy orders
 * @param sellOrders the current list of sell orders
 */
public record OrderBookSnapshot(
        List<OrderRequest> buyOrders,
        List<OrderRequest> sellOrders
) {}
