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

    /**
     * Template for sending messages via WebSockets.
     */
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * A priority queue for buy orders, ordered by highest price and then by earliest timestamp.
     */
    private final PriorityQueue<OrderRequest> buyOrders = new PriorityQueue<>(
            Comparator.comparing(OrderRequest::price).reversed()
                    .thenComparing(OrderRequest::timestamp)
    );

    /**
     * A priority queue for sell orders, ordered by lowest price and then by earliest timestamp.
     */
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

            if (highestBuy.price().compareTo(lowestSell.price()) < 0) {
                break;
            }

            buyOrders.poll();
            sellOrders.poll();

            BigDecimal executionPrice = highestBuy.timestamp().isBefore(lowestSell.timestamp())
                    ? highestBuy.price()
                    : lowestSell.price();

            BigDecimal executionAmount = highestBuy.amount().min(lowestSell.amount());

            Trade trade = new Trade(highestBuy.courierId(), lowestSell.courierId(), executionPrice, executionAmount);

            entityManager.persist(trade);

            log.info("Trade Executed! Buyer: {}, Seller: {}, Price: {}",
                    trade.getBuyerId(), trade.getSellerId(), executionPrice);

            messagingTemplate.convertAndSend("/topic/trades", trade);
        }
    }

    @Override
    public synchronized void flushMarket() {
        buyOrders.clear();
        sellOrders.clear();
        log.info("Order book flushed.");

        messagingTemplate.convertAndSend("/topic/orderbook", getOrderBookSnapshot());
    }

    @Override
    public OrderBookSnapshot getOrderBookSnapshot() {
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