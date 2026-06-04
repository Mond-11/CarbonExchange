package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.OrderBookSnapshot;
import com.carbonexchange.tradingengine.domain.market.model.OrderRequest;
import com.carbonexchange.tradingengine.domain.market.model.Trade;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.PriorityQueue;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContinuousDoubleAuctionEngine implements MatchingEngine {

    private final EntityManager entityManager;

    // The WebSocket messenger injected perfectly
    private final SimpMessagingTemplate messagingTemplate;

    // Max-Heap: Highest buy price gets priority
    private final PriorityQueue<OrderRequest> buyOrders = new PriorityQueue<>(
            Comparator.comparing(OrderRequest::price).reversed()
                    .thenComparing(OrderRequest::timestamp) // FIFO for same price
    );

    // Min-Heap: Lowest sell price gets priority
    private final PriorityQueue<OrderRequest> sellOrders = new PriorityQueue<>(
            Comparator.comparing(OrderRequest::price)
                    .thenComparing(OrderRequest::timestamp)
    );

    @Override
    @Transactional
    public synchronized void processOrder(OrderRequest order) {
        log.info("Received Order: {}", order);

        if (order.type() == OrderRequest.OrderType.BUY) {
            buyOrders.add(order);
        } else {
            sellOrders.add(order);
        }

        matchOrders();

        // BROADCAST 1: Send the updated order book state to React every time the queues change
        messagingTemplate.convertAndSend("/topic/orderbook", getOrderBookSnapshot());
    }

    /**
     * The core algorithm: Checks if the highest buyer is willing to pay
     * at least what the lowest seller is asking.
     */
    private void matchOrders() {
        while (!buyOrders.isEmpty() && !sellOrders.isEmpty()) {
            OrderRequest highestBuy = buyOrders.peek();
            OrderRequest lowestSell = sellOrders.peek();

            // If the highest buyer won't meet the lowest seller's price, no match is possible
            if (highestBuy.price().compareTo(lowestSell.price()) < 0) {
                break;
            }

            // A match is found!
            buyOrders.poll();
            sellOrders.poll();

            // Determine execution price (usually the price of the order that rested in the book first)
            BigDecimal executionPrice = highestBuy.timestamp().isBefore(lowestSell.timestamp())
                    ? highestBuy.price()
                    : lowestSell.price();

            // Determine the quantity exchanged
            BigDecimal executionAmount = highestBuy.amount().min(lowestSell.amount());

            Trade trade = new Trade(highestBuy.courierId(), lowestSell.courierId(), executionPrice, executionAmount);

            // Persist the executed trade to PostgreSQL
            entityManager.persist(trade);

            log.info("Trade Executed! Buyer: {}, Seller: {}, Price: {}",
                    trade.getBuyerId(), trade.getSellerId(), executionPrice);

            // BROADCAST 2: Send the newly executed trade directly to the React history table
            messagingTemplate.convertAndSend("/topic/trades", trade);

            // NOTE 1 order = 1 chunk.
            // If implement partial fills later (e.g., Buy 5, Sell 3, leaving 2 remaining),
            // mathematically subtract the executionAmount and re-insert
            // the remaining OrderRequest back into the buyOrders or sellOrders queue right here.
        }
    }

    @Override
    public synchronized void flushMarket() {
        buyOrders.clear();
        sellOrders.clear();
        log.info("Order book flushed.");

        // BROADCAST 3: Clear the React UI when the market is flushed
        messagingTemplate.convertAndSend("/topic/orderbook", getOrderBookSnapshot());
    }

    @Override
    public OrderBookSnapshot getOrderBookSnapshot() {
        // Stream and sort so the client sees the exact market priority
        var buys = buyOrders.stream()
                .sorted(Comparator.comparing(OrderRequest::price).reversed()
                        .thenComparing(OrderRequest::timestamp))
                .toList();

        var sells = sellOrders.stream()
                .sorted(Comparator.comparing(OrderRequest::price)
                        .thenComparing(OrderRequest::timestamp))
                .toList();

        return new OrderBookSnapshot(buys, sells);
    }
}