package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.Trade;
import com.carbonexchange.tradingengine.domain.market.repository.TradeRepository;
import com.carbonexchange.tradingengine.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TradeConsumer {

    private final TradeRepository tradeRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserService userService;

    private static final UUID SYSTEM_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    @KafkaListener(topics = "trades", groupId = "trading-engine-trades-group")
    @Transactional
    public void consume(Trade trade) {
        log.info("Consumed trade from Kafka. Persisting and notifying: {}", trade.getBuyerId());
        tradeRepository.save(trade);

        BigDecimal totalCost = trade.getPrice().multiply(trade.getAmount());

        // Update Buyer: loses money, gains credits
        if (!trade.getBuyerId().equals(SYSTEM_ID)) {
            userService.updateBalances(trade.getBuyerId(), totalCost.negate(), trade.getAmount());
        }

        // Update Seller: gains money, loses credits
        if (!trade.getSellerId().equals(SYSTEM_ID)) {
            userService.updateBalances(trade.getSellerId(), totalCost, trade.getAmount().negate());
        }

        messagingTemplate.convertAndSend("/topic/trades", trade);
    }
}
