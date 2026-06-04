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

    private BigDecimal lastTradedPrice = new BigDecimal("15.00");

    /**
     * A priority queue for buy orders, ordered by execution mode (MARKET first), 
     * then by highest price, and then by earliest timestamp.
     */
    private final PriorityQueue<OrderRequest> buyOrders = new PriorityQueue<>(
            Comparator.comparing((OrderRequest o) -> o.executionMode() == OrderRequest.ExecutionMode.MARKET ? 0 : 1)
                    .thenComparing(Comparator.comparing(OrderRequest::price, Comparator.nullsLast(Comparator.reverseOrder())))
                    .thenComparing(OrderRequest::timestamp)
    );

    /**
     * A priority queue for sell orders, ordered by execution mode (MARKET first),
     * then by lowest price, and then by earliest timestamp.
     */
    private final PriorityQueue<OrderRequest> sellOrders = new PriorityQueue<>(
            Comparator.comparing((OrderRequest o) -> o.executionMode() == OrderRequest.ExecutionMode.MARKET ? 0 : 1)
                    .thenComparing(Comparator.comparing(OrderRequest::price, Comparator.nullsLast(Comparator.naturalOrder())))
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
     * at least what the lowest seller is asking, or if market orders are present.
     */
    private void matchOrders() {
        while (!buyOrders.isEmpty() && !sellOrders.isEmpty()) {
            OrderRequest highestBuy = buyOrders.peek();
            OrderRequest lowestSell = sellOrders.peek();

            if (highestBuy.executionMode() == OrderRequest.ExecutionMode.LIMIT &&
                lowestSell.executionMode() == OrderRequest.ExecutionMode.LIMIT &&
                highestBuy.price().compareTo(lowestSell.price()) < 0) {
                break;
            }

            buyOrders.poll();
            sellOrders.poll();

            BigDecimal executionPrice = determineExecutionPrice(highestBuy, lowestSell);
            BigDecimal executionAmount = highestBuy.amount().min(lowestSell.amount());

            Trade trade = new Trade(highestBuy.courierId(), lowestSell.courierId(), executionPrice, executionAmount);
            lastTradedPrice = executionPrice;

            entityManager.persist(trade);

            log.info("Trade Executed! Buyer: {}, Seller: {}, Price: {}, Amount: {}",
                    trade.getBuyerId(), trade.getSellerId(), executionPrice, executionAmount);

            messagingTemplate.convertAndSend("/topic/trades", trade);

            // Partial matching: return remaining amounts to the queue
            if (highestBuy.amount().compareTo(executionAmount) > 0) {
                buyOrders.add(new OrderRequest(
                        highestBuy.courierId(),
                        highestBuy.type(),
                        highestBuy.executionMode(),
                        highestBuy.amount().subtract(executionAmount),
                        highestBuy.price(),
                        highestBuy.timestamp()
                ));
            }

            if (lowestSell.amount().compareTo(executionAmount) > 0) {
                sellOrders.add(new OrderRequest(
                        lowestSell.courierId(),
                        lowestSell.type(),
                        lowestSell.executionMode(),
                        lowestSell.amount().subtract(executionAmount),
                        lowestSell.price(),
                        lowestSell.timestamp()
                ));
            }
        }
    }

    private BigDecimal determineExecutionPrice(OrderRequest buy, OrderRequest sell) {
        if (buy.executionMode() == OrderRequest.ExecutionMode.MARKET &&
            sell.executionMode() == OrderRequest.ExecutionMode.MARKET) {
            return lastTradedPrice;
        }
        if (buy.executionMode() == OrderRequest.ExecutionMode.MARKET) {
            return sell.price();
        }
        if (sell.executionMode() == OrderRequest.ExecutionMode.MARKET) {
            return buy.price();
        }
        // Both are LIMIT orders
        return buy.timestamp().isBefore(sell.timestamp()) ? buy.price() : sell.price();
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
                .sorted(Comparator.comparing((OrderRequest o) -> o.executionMode() == OrderRequest.ExecutionMode.MARKET ? 0 : 1)
                        .thenComparing(Comparator.comparing(OrderRequest::price, Comparator.nullsLast(Comparator.reverseOrder())))
                        .thenComparing(OrderRequest::timestamp))
                .toList();

        var sells = sellOrders.stream()
                .sorted(Comparator.comparing((OrderRequest o) -> o.executionMode() == OrderRequest.ExecutionMode.MARKET ? 0 : 1)
                        .thenComparing(Comparator.comparing(OrderRequest::price, Comparator.nullsLast(Comparator.naturalOrder())))
                        .thenComparing(OrderRequest::timestamp))
                .toList();

        return new OrderBookSnapshot(buys, sells);
    }
}