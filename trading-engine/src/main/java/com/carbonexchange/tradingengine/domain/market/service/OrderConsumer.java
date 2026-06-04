package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.OrderRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

/*
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderConsumer {

    private final MatchingEngine matchingEngine;

    @KafkaListener(topics = "incoming-orders", groupId = "trading-engine-group")
    public void consume(OrderRequest order) {
        log.info("Consumed order from Kafka. Handing to Matching Engine: {}", order.courierId());

        matchingEngine.processOrder(order);
    }
}
*/
