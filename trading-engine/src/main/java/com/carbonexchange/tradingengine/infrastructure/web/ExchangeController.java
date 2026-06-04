package com.carbonexchange.tradingengine.infrastructure.web;

import com.carbonexchange.tradingengine.domain.market.model.OrderBookSnapshot;
import com.carbonexchange.tradingengine.domain.market.model.OrderRequest;
import com.carbonexchange.tradingengine.domain.market.model.Trade;
import com.carbonexchange.tradingengine.domain.market.repository.TradeRepository;
import com.carbonexchange.tradingengine.domain.market.service.MatchingEngine;
import com.carbonexchange.tradingengine.domain.market.service.OrderProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/exchange")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ExchangeController {

    private final MatchingEngine matchingEngine;
    private final TradeRepository tradeRepository;
    private final OrderProducer orderProducer;

    /**
     * Places an order by sending it to the order producer.
     * 
     * @param order the order request to place
     * @return a response entity indicating the order has been accepted
     */
    @PostMapping("/order")
    public ResponseEntity<String> placeOrder(@RequestBody OrderRequest order) {
        orderProducer.sendOrder(order);

        return ResponseEntity.accepted().body("Order received and queued for processing.");
    }

    /**
     * Triggers an emergency resolve of all ongoing orders.
     * 
     * @return a response entity indicating the command has been issued
     */
    @PostMapping("/emergency-resolve")
    public ResponseEntity<String> emergencyResolve() {
        OrderRequest clearAll = new OrderRequest(
                UUID.fromString("00000000-0000-0000-0000-000000000000"),
                OrderRequest.OrderType.CLEAR_ALL,
                OrderRequest.ExecutionMode.LIMIT,
                BigDecimal.ONE,
                BigDecimal.ZERO,
                Instant.now()
        );
        orderProducer.sendOrder(clearAll);
        return ResponseEntity.ok("Emergency resolve command issued.");
    }

    /**
     * Retrieves the current state of the order book.
     * 
     * @return a response entity containing the order book snapshot
     */
    @GetMapping("/orderbook")
    public ResponseEntity<OrderBookSnapshot> getOrderBook() {
        return ResponseEntity.ok(matchingEngine.getOrderBookSnapshot());
    }

    /**
     * Retrieves the history of all executed trades.
     * 
     * @return a response entity containing a list of trades
     */
    @GetMapping("/trades")
    public ResponseEntity<List<Trade>> getTradeHistory() {
        return ResponseEntity.ok(tradeRepository.findTop30ByOrderByExecutedAtDesc());
    }

    /**
     * Flushes the market by clearing all orders from the matching engine.
     * 
     * @return a response entity indicating the market has been flushed
     */
    @DeleteMapping("/flush")
    public ResponseEntity<String> flushMarket() {
        matchingEngine.flushMarket();
        return ResponseEntity.ok("Market flushed.");
    }
}