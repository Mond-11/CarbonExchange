package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.OrderBookSnapshot;
import com.carbonexchange.tradingengine.domain.market.model.OrderRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implementation of the {@link MatchingEngine} that acts as a reactive view of the market.
 * It listens to order book snapshots from Kafka and broadcasts them to the UI via WebSockets.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContinuousDoubleAuctionEngine implements MatchingEngine {

    private final SimpMessagingTemplate messagingTemplate;
    private OrderBookSnapshot currentSnapshot = new OrderBookSnapshot(List.of(), List.of());

    @Override
    public void processOrder(OrderRequest order) {
        // Now handled by Kafka Streams. 
        // If this is called directly, we just log it.
        log.warn("processOrder called directly on Engine. This should be handled by Kafka Streams. Order: {}", order.courierId());
    }

    /**
     * Updates the local view of the order book from a Kafka snapshot.
     * Also broadcasts the snapshot to all connected WebSocket clients.
     * 
     * @param snapshot the new order book snapshot
     */
    @org.springframework.kafka.annotation.KafkaListener(topics = "orderbook-snapshots", groupId = "trading-engine-engine-group")
    public void updateSnapshot(OrderBookSnapshot snapshot) {
        log.info("Received Snapshot update from Kafka");
        this.currentSnapshot = snapshot;
        messagingTemplate.convertAndSend("/topic/orderbook", snapshot);
    }

    @Override
    public void flushMarket() {
        // Flushing is now more complex. For now, we just clear local view.
        // In a real system, we'd send a "FlushCommand" through Kafka.
        currentSnapshot = new OrderBookSnapshot(java.util.List.of(), java.util.List.of());
        log.info("Local order book flushed.");
        messagingTemplate.convertAndSend("/topic/orderbook", getOrderBookSnapshot());
    }

    @Override
    public OrderBookSnapshot getOrderBookSnapshot() {
        return currentSnapshot;
    }
}