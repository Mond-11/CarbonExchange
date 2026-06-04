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

    /**
     * Kafka template for sending OrderRequest messages.
     */
    private final KafkaTemplate<String, OrderRequest> kafkaTemplate;

    /**
     * The Kafka topic for incoming orders.
     */
    private static final String TOPIC = "incoming-orders";

    /**
     * Sends an order to the Kafka topic.
     * 
     * @param order the order request to send
     */
    public void sendOrder(OrderRequest order) {
        log.info("Publishing order to Kafka Topic: {}", order.courierId());
        kafkaTemplate.send(TOPIC, order.courierId().toString(), order);
    }
}
