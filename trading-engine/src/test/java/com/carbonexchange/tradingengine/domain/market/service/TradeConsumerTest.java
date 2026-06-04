package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.Trade;
import com.carbonexchange.tradingengine.domain.market.repository.TradeRepository;
import com.carbonexchange.tradingengine.domain.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TradeConsumerTest {

    @Mock
    private TradeRepository tradeRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private UserService userService;

    @InjectMocks
    private TradeConsumer tradeConsumer;

    private Trade trade;
    private final UUID buyerId = UUID.randomUUID();
    private final UUID sellerId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        trade = new Trade(buyerId, sellerId, new BigDecimal("10.00"), new BigDecimal("5.0"));
    }

    @Test
    void shouldPersistTradeAndNotify() {
        tradeConsumer.consume(trade);

        verify(tradeRepository).save(trade);
        verify(userService).updateBalances(eq(buyerId), any(BigDecimal.class), eq(new BigDecimal("5.0")));
        verify(userService).updateBalances(eq(sellerId), any(BigDecimal.class), eq(new BigDecimal("-5.0")));
        verify(messagingTemplate).convertAndSend(eq("/topic/trades"), eq(trade));
    }

    @Test
    void shouldNotUpdateBalancesForSystemAccount() {
        UUID systemId = UUID.fromString("00000000-0000-0000-0000-000000000000");
        Trade systemTrade = new Trade(systemId, sellerId, new BigDecimal("10.00"), new BigDecimal("5.0"));

        tradeConsumer.consume(systemTrade);

        verify(userService, never()).updateBalances(eq(systemId), any(), any());
        verify(userService).updateBalances(eq(sellerId), any(), any());
    }
}
