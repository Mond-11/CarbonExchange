package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.OrderBookSnapshot;
import com.carbonexchange.tradingengine.domain.market.model.OrderRequest;
import com.carbonexchange.tradingengine.domain.market.model.Trade;
import jakarta.persistence.EntityManager;
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
    private EntityManager entityManager;

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
    void shouldAddBuyOrderAndNotMatch() {
        OrderRequest buyOrder = new OrderRequest(courier1, OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.0"), new BigDecimal("50.0"), Instant.now());
        
        engine.processOrder(buyOrder);

        OrderBookSnapshot snapshot = engine.getOrderBookSnapshot();
        assertEquals(1, snapshot.buyOrders().size());
        assertEquals(0, snapshot.sellOrders().size());
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/orderbook"), any(OrderBookSnapshot.class));
        verify(entityManager, never()).persist(any());
    }

    @Test
    void shouldAddSellOrderAndNotMatch() {
        OrderRequest sellOrder = new OrderRequest(courier1, OrderRequest.OrderType.SELL, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.0"), new BigDecimal("60.0"), Instant.now());

        engine.processOrder(sellOrder);

        OrderBookSnapshot snapshot = engine.getOrderBookSnapshot();
        assertEquals(0, snapshot.buyOrders().size());
        assertEquals(1, snapshot.sellOrders().size());
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/orderbook"), any(OrderBookSnapshot.class));
        verify(entityManager, never()).persist(any());
    }

    @Test
    void shouldMatchOrdersExactly() {
        Instant now = Instant.now();
        OrderRequest buyOrder = new OrderRequest(courier1, OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.0"), new BigDecimal("50.0"), now.minusSeconds(10));
        OrderRequest sellOrder = new OrderRequest(courier2, OrderRequest.OrderType.SELL, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.0"), new BigDecimal("50.0"), now);

        engine.processOrder(buyOrder);
        engine.processOrder(sellOrder);

        OrderBookSnapshot snapshot = engine.getOrderBookSnapshot();
        assertTrue(snapshot.buyOrders().isEmpty());
        assertTrue(snapshot.sellOrders().isEmpty());

        verify(entityManager, times(1)).persist(any(Trade.class));
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/trades"), any(Trade.class));
    }

    @Test
    void shouldMatchWithPriceOverlap() {
        Instant now = Instant.now();
        // Buyer wants to buy for 55, Seller wants to sell for 50. Match at 55 (buyer was first).
        OrderRequest buyOrder = new OrderRequest(courier1, OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.0"), new BigDecimal("55.0"), now.minusSeconds(10));
        OrderRequest sellOrder = new OrderRequest(courier2, OrderRequest.OrderType.SELL, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.0"), new BigDecimal("50.0"), now);

        engine.processOrder(buyOrder);
        engine.processOrder(sellOrder);

        verify(entityManager).persist(argThat(obj -> {
            Trade trade = (Trade) obj;
            return trade.getPrice().compareTo(new BigDecimal("55.0")) == 0;
        }));
    }

    @Test
    void shouldFlushMarket() {
        OrderRequest buyOrder = new OrderRequest(courier1, OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.0"), new BigDecimal("50.0"), Instant.now());
        engine.processOrder(buyOrder);
        
        engine.flushMarket();

        OrderBookSnapshot snapshot = engine.getOrderBookSnapshot();
        assertTrue(snapshot.buyOrders().isEmpty());
    }

    @Test
    void shouldMatchOrdersPartially() {
        Instant now = Instant.now();
        // Buyer wants 10, Seller has 6.
        OrderRequest buyOrder = new OrderRequest(courier1, OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.0"), new BigDecimal("50.0"), now.minusSeconds(10));
        OrderRequest sellOrder = new OrderRequest(courier2, OrderRequest.OrderType.SELL, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("6.0"), new BigDecimal("50.0"), now);

        engine.processOrder(buyOrder);
        engine.processOrder(sellOrder);

        OrderBookSnapshot snapshot = engine.getOrderBookSnapshot();
        assertEquals(1, snapshot.buyOrders().size());
        assertEquals(0, snapshot.buyOrders().get(0).amount().compareTo(new BigDecimal("4.0")));
        assertTrue(snapshot.sellOrders().isEmpty());

        verify(entityManager, times(1)).persist(any(Trade.class));
    }

    @Test
    void shouldMatchMarketOrder() {
        Instant now = Instant.now();
        // Seller has LIMIT order at 50.
        OrderRequest sellOrder = new OrderRequest(courier2, OrderRequest.OrderType.SELL, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.0"), new BigDecimal("50.0"), now.minusSeconds(10));
        // Buyer wants to buy at MARKET price.
        OrderRequest buyOrder = new OrderRequest(courier1, OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.MARKET, new BigDecimal("5.0"), null, now);

        engine.processOrder(sellOrder);
        engine.processOrder(buyOrder);

        verify(entityManager).persist(argThat(obj -> {
            Trade trade = (Trade) obj;
            return trade.getPrice().compareTo(new BigDecimal("50.0")) == 0 &&
                   trade.getAmount().compareTo(new BigDecimal("5.0")) == 0;
        }));

        OrderBookSnapshot snapshot = engine.getOrderBookSnapshot();
        assertEquals(1, snapshot.sellOrders().size());
        assertEquals(0, snapshot.sellOrders().get(0).amount().compareTo(new BigDecimal("5.0")));
    }
}
