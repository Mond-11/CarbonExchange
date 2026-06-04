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

import java.util.List;

@RestController
@RequestMapping("/api/v1/exchange")
@RequiredArgsConstructor
public class ExchangeController {

    private final MatchingEngine matchingEngine;
    private final TradeRepository tradeRepository;
    private final OrderProducer orderProducer;

    @PostMapping("/order")
    public ResponseEntity<String> placeOrder(@RequestBody OrderRequest order) {
        orderProducer.sendOrder(order);

        return ResponseEntity.accepted().body("Order received and queued for processing.");
    }

    @GetMapping("/orderbook")
    public ResponseEntity<OrderBookSnapshot> getOrderBook() {
        return ResponseEntity.ok(matchingEngine.getOrderBookSnapshot());
    }

    @GetMapping("/trades")
    public ResponseEntity<List<Trade>> getTradeHistory() {
        // Fetches all executed trades from PostgreSQL
        return ResponseEntity.ok(tradeRepository.findAll());
    }

    @DeleteMapping("/flush")
    public ResponseEntity<String> flushMarket() {
        matchingEngine.flushMarket();
        return ResponseEntity.ok("Market flushed.");
    }
}