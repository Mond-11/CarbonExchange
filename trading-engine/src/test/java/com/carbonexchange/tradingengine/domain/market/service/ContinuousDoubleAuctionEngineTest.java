package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.OrderBookSnapshot;
import com.carbonexchange.tradingengine.domain.market.model.OrderRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContinuousDoubleAuctionEngineTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ContinuousDoubleAuctionEngine engine;

    private UUID courier1;
    private UUID courier2;

    @BeforeEach
    void setUp() {
        courier1 = UUID.randomUUID();
        courier2 = UUID.randomUUID();
    }

    @Test
    void shouldUpdateSnapshotOnKafkaMessage() {
        OrderBookSnapshot snapshot = new OrderBookSnapshot(
                java.util.List.of(new OrderRequest(courier1, OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, BigDecimal.TEN, BigDecimal.ONE, Instant.now())),
                java.util.List.of()
        );
        
        engine.updateSnapshot(snapshot);

        assertEquals(snapshot, engine.getOrderBookSnapshot());
        verify(messagingTemplate).convertAndSend(eq("/topic/orderbook"), eq(snapshot));
    }

    @Test
    void shouldFlushMarketLocally() {
        OrderBookSnapshot snapshot = new OrderBookSnapshot(
                java.util.List.of(new OrderRequest(courier1, OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, BigDecimal.TEN, BigDecimal.ONE, Instant.now())),
                java.util.List.of()
        );
        engine.updateSnapshot(snapshot);
        
        engine.flushMarket();

        OrderBookSnapshot flushed = engine.getOrderBookSnapshot();
        assertTrue(flushed.buyOrders().isEmpty());
        assertTrue(flushed.sellOrders().isEmpty());
        verify(messagingTemplate, atLeast(2)).convertAndSend(eq("/topic/orderbook"), any(OrderBookSnapshot.class));
    }
}
