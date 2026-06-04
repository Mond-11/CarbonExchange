package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.Trade;
import com.carbonexchange.tradingengine.domain.market.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TradeConsumer {

    private final TradeRepository tradeRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "trades", groupId = "trading-engine-trades-group")
    @Transactional
    public void consume(Trade trade) {
        log.info("Consumed trade from Kafka. Persisting and notifying: {}", trade.getBuyerId());
        tradeRepository.save(trade);
        messagingTemplate.convertAndSend("/topic/trades", trade);
    }
}
