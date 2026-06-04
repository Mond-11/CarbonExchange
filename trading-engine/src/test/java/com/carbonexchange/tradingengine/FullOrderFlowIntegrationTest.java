package com.carbonexchange.tradingengine;

import com.carbonexchange.tradingengine.domain.market.model.OrderRequest;
import com.carbonexchange.tradingengine.domain.market.model.Trade;
import com.carbonexchange.tradingengine.domain.market.repository.TradeRepository;
import com.carbonexchange.tradingengine.domain.market.service.OrderProducer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.kafka.core.KafkaTemplate;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = {"incoming-orders", "trades", "orderbook-snapshots"})
@ActiveProfiles("test")
public class FullOrderFlowIntegrationTest {

    @Autowired
    private OrderProducer orderProducer;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @MockitoBean
    private SimpMessagingTemplate messagingTemplate;

    @Test
    void shouldProduceOrderAndPersistTrade() {
        // Given
        UUID courierId = UUID.randomUUID();
        OrderRequest order = new OrderRequest(
                courierId,
                OrderRequest.OrderType.BUY,
                OrderRequest.ExecutionMode.LIMIT,
                new BigDecimal("10.00"),
                new BigDecimal("20.00"),
                Instant.now()
        );

        // When: Send order to producer
        orderProducer.sendOrder(order);

        // Simulated matching (since Streams is disabled in tests)
        Trade trade = new Trade(courierId, UUID.randomUUID(), new BigDecimal("20.00"), new BigDecimal("10.00"));
        kafkaTemplate.send("trades", courierId.toString(), trade);

        // Then: Wait for TradeConsumer to persist to DB
        await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
            List<Trade> trades = tradeRepository.findAll();
            assertThat(trades).isNotEmpty();
        });

        List<Trade> trades = tradeRepository.findAll();
        assertThat(trades).hasSize(1);
        Trade persisted = trades.get(0);
        assertThat(persisted.getBuyerId()).isEqualTo(courierId);
    }
}
