package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.OrderRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OrderConsumerTest {

    @Mock
    private MatchingEngine matchingEngine;

    @InjectMocks
    private OrderConsumer orderConsumer;

    @Test
    void shouldConsumeOrder() {
        OrderRequest order = new OrderRequest(UUID.randomUUID(), OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, BigDecimal.TEN, BigDecimal.ONE, Instant.now());

        orderConsumer.consume(order);

        verify(matchingEngine).processOrder(order);
    }
}
