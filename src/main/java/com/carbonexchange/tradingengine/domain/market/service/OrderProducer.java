package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.OrderRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderProducer {

    // Spring's built-in tool for sending messages to Kafka
    private final KafkaTemplate<String, OrderRequest> kafkaTemplate;

    // The name of the "channel" we are broadcasting on
    private static final String TOPIC = "incoming-orders";

    public void sendOrder(OrderRequest order) {
        log.info("Publishing order to Kafka Topic: {}", order.courierId());
        // We use the Courier ID as the Kafka Key to ensure orders from the same
        // courier are processed in the exact order they were sent.
        kafkaTemplate.send(TOPIC, order.courierId().toString(), order);
    }
}
