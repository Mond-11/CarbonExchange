package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.OrderRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderProducerTest {

    @Mock
    private KafkaTemplate<String, OrderRequest> kafkaTemplate;

    @InjectMocks
    private OrderProducer orderProducer;

    @Test
    void shouldSendOrder() {
        OrderRequest order = new OrderRequest(UUID.randomUUID(), OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, BigDecimal.TEN, BigDecimal.ONE, Instant.now());
        
        orderProducer.sendOrder(order);

        verify(kafkaTemplate).send(eq("incoming-orders"), eq(order.courierId().toString()), eq(order));
    }

    @Test
    void shouldThrowExceptionWhenAmountIsZero() {
        assertThrows(IllegalArgumentException.class, () -> {
            new OrderRequest(UUID.randomUUID(), OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, BigDecimal.ZERO, BigDecimal.ONE, Instant.now());
        });
    }
}
