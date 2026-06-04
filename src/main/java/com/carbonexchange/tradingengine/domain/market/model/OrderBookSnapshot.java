package com.carbonexchange.tradingengine.domain.market.model;

import java.util.List;

public record OrderBookSnapshot(
        List<OrderRequest> buyOrders,
        List<OrderRequest> sellOrders
) {}
