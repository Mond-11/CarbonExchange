package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.kafka.common.serialization.Serde;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.*;
import org.apache.kafka.streams.state.KeyValueStore;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.support.serializer.JsonSerde;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Properties;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class MatchingEngineTopologyTest {

    private TopologyTestDriver testDriver;
    private TestInputTopic<String, OrderRequest> inputTopic;
    private TestOutputTopic<String, Trade> tradeOutputTopic;
    private TestOutputTopic<String, OrderBookSnapshot> snapshotOutputTopic;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    private final Serde<OrderRequest> orderRequestSerde = new JsonSerde<>(OrderRequest.class, objectMapper);
    private final Serde<Trade> tradeSerde = new JsonSerde<>(Trade.class, objectMapper);
    private final Serde<OrderBookSnapshot> orderBookSnapshotSerde = new JsonSerde<>(OrderBookSnapshot.class, objectMapper);
    private final Serde<OrderBookState> orderBookStateSerde = new JsonSerde<>(OrderBookState.class, objectMapper);

    @BeforeEach
    void setup() {
        MatchingEngineTopology matchingEngineTopology = new MatchingEngineTopology();

        StreamsBuilder builder = new StreamsBuilder();
        matchingEngineTopology.matchingStream(builder, objectMapper);
        Topology topology = builder.build();

        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "test");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "dummy:1234");

        testDriver = new TopologyTestDriver(topology, props);

        inputTopic = testDriver.createInputTopic(
                "incoming-orders",
                Serdes.String().serializer(),
                orderRequestSerde.serializer()
        );

        tradeOutputTopic = testDriver.createOutputTopic(
                "trades",
                Serdes.String().deserializer(),
                tradeSerde.deserializer()
        );

        snapshotOutputTopic = testDriver.createOutputTopic(
                "orderbook-snapshots",
                Serdes.String().deserializer(),
                orderBookSnapshotSerde.deserializer()
        );
    }

    @AfterEach
    void tearDown() {
        testDriver.close();
    }

    @Test
    void shouldMatchOrders() {
        UUID buyerId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        Instant now = Instant.now();

        OrderRequest buyOrder = new OrderRequest(buyerId, OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.00"), new BigDecimal("20.00"), now.minusSeconds(10));
        OrderRequest sellOrder = new OrderRequest(sellerId, OrderRequest.OrderType.SELL, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.00"), new BigDecimal("15.00"), now);

        inputTopic.pipeInput(buyerId.toString(), buyOrder);
        inputTopic.pipeInput(sellerId.toString(), sellOrder);

        assertThat(tradeOutputTopic.isEmpty()).isFalse();
        Trade trade = tradeOutputTopic.readRecord().value();
        assertThat(trade.getBuyerId()).isEqualTo(buyerId);
        assertThat(trade.getSellerId()).isEqualTo(sellerId);
        assertThat(trade.getPrice()).isEqualByComparingTo("20.00");
    }

    @Test
    void shouldMaintainOrderBookState() {
        UUID buyerId = UUID.randomUUID();
        OrderRequest buyOrder = new OrderRequest(buyerId, OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.00"), new BigDecimal("20.00"), Instant.now());

        inputTopic.pipeInput(buyerId.toString(), buyOrder);

        assertThat(snapshotOutputTopic.isEmpty()).isFalse();
        OrderBookSnapshot snapshot = snapshotOutputTopic.readValuesToList().get(0);
        assertThat(snapshot.buyOrders()).hasSize(1);
        assertThat(snapshot.buyOrders().get(0).courierId()).isEqualTo(buyerId);

        KeyValueStore<String, OrderBookState> store = testDriver.getKeyValueStore("order-book-store");
        OrderBookState state = store.get("GLOBAL_BOOK");
        assertThat(state.getBuyOrders()).hasSize(1);
    }

    @Test
    void shouldClearExcessLiquidity() {
        // Send orders that sum up to more than 500.0 volume
        // Each order 10.0 volume -> 51 orders = 510.0 volume
        UUID oldestId = null;
        for (int i = 0; i < 51; i++) {
            UUID id = UUID.randomUUID();
            if (i == 0) oldestId = id;
            OrderRequest sellOrder = new OrderRequest(
                    id,
                    OrderRequest.OrderType.SELL,
                    OrderRequest.ExecutionMode.LIMIT,
                    new BigDecimal("10.00"),
                    new BigDecimal("100.00"),
                    Instant.now().plusSeconds(i) // Ensure deterministic aging
            );
            inputTopic.pipeInput(sellOrder.courierId().toString(), sellOrder);
        }

        // We expect at least one trade in the tradeOutputTopic (the 51st order should trigger clearing of the 1st/oldest)
        assertThat(tradeOutputTopic.isEmpty()).isFalse();
        Trade clearingTrade = tradeOutputTopic.readRecord().value();
        assertThat(clearingTrade.getBuyerId()).isEqualTo(UUID.fromString("00000000-0000-0000-0000-000000000000"));
        assertThat(clearingTrade.getSellerId()).isEqualTo(oldestId);
        
        // Also verify the snapshot volume is limited
        OrderBookSnapshot lastSnapshot = snapshotOutputTopic.readValuesToList().get(50);
        BigDecimal totalVolume = lastSnapshot.sellOrders().stream()
                .map(OrderRequest::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(totalVolume).isLessThanOrEqualTo(new BigDecimal("500.0"));
    }

    @Test
    void shouldEmergencyClearAll() {
        // Send some orders
        inputTopic.pipeInput("buy1", new OrderRequest(UUID.randomUUID(), OrderRequest.OrderType.BUY, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.0"), new BigDecimal("20.0"), Instant.now()));
        inputTopic.pipeInput("sell1", new OrderRequest(UUID.randomUUID(), OrderRequest.OrderType.SELL, OrderRequest.ExecutionMode.LIMIT, new BigDecimal("10.0"), new BigDecimal("25.0"), Instant.now()));

        // Verify they are in the book
        OrderBookSnapshot snapshotBefore = snapshotOutputTopic.readValuesToList().get(1);
        assertThat(snapshotBefore.buyOrders()).hasSize(1);
        assertThat(snapshotBefore.sellOrders()).hasSize(1);

        // Send CLEAR_ALL
        inputTopic.pipeInput("clear", new OrderRequest(UUID.randomUUID(), OrderRequest.OrderType.CLEAR_ALL, OrderRequest.ExecutionMode.LIMIT, BigDecimal.ONE, BigDecimal.ZERO, Instant.now()));

        // Verify the book is empty
        List<OrderBookSnapshot> snapshots = snapshotOutputTopic.readValuesToList();
        OrderBookSnapshot lastSnapshot = snapshots.get(snapshots.size() - 1);
        assertThat(lastSnapshot.buyOrders()).isEmpty();
        assertThat(lastSnapshot.sellOrders()).isEmpty();
        
        // Verify trades were generated for clearing
        assertThat(tradeOutputTopic.readValuesToList()).hasSize(2);
    }
}
