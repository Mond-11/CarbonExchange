package com.carbonexchange.tradingengine.infrastructure.web;

import com.carbonexchange.tradingengine.domain.market.model.OrderBookSnapshot;
import com.carbonexchange.tradingengine.domain.market.model.OrderRequest;
import com.carbonexchange.tradingengine.domain.market.repository.TradeRepository;
import com.carbonexchange.tradingengine.domain.market.service.MatchingEngine;
import com.carbonexchange.tradingengine.domain.market.service.OrderProducer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ExchangeControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MatchingEngine matchingEngine;

    @Mock
    private TradeRepository tradeRepository;

    @Mock
    private OrderProducer orderProducer;

    @InjectMocks
    private ExchangeController exchangeController;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(exchangeController).build();
    }

    @Test
    void shouldPlaceOrder() throws Exception {
        OrderRequest order = new OrderRequest(UUID.randomUUID(), OrderRequest.OrderType.BUY, BigDecimal.TEN, BigDecimal.ONE, Instant.now());

        mockMvc.perform(post("/api/v1/exchange/order")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(order)))
                .andExpect(status().isAccepted())
                .andExpect(content().string("Order received and queued for processing."));

        verify(orderProducer).sendOrder(any(OrderRequest.class));
    }

    @Test
    void shouldGetOrderBook() throws Exception {
        OrderBookSnapshot snapshot = new OrderBookSnapshot(List.of(), List.of());
        when(matchingEngine.getOrderBookSnapshot()).thenReturn(snapshot);

        mockMvc.perform(get("/api/v1/exchange/orderbook"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.buyOrders").isArray())
                .andExpect(jsonPath("$.sellOrders").isArray());
    }

    @Test
    void shouldGetTradeHistory() throws Exception {
        when(tradeRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/exchange/trades"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void shouldFlushMarket() throws Exception {
        mockMvc.perform(delete("/api/v1/exchange/flush"))
                .andExpect(status().isOk())
                .andExpect(content().string("Market flushed."));

        verify(matchingEngine).flushMarket();
    }
}
