package com.carbonexchange.tradingengine.domain.market.service;

import com.carbonexchange.tradingengine.domain.market.model.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.serialization.Serde;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.Topology;
import org.apache.kafka.streams.kstream.Consumed;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.Produced;
import org.apache.kafka.streams.processor.api.ContextualProcessor;
import org.apache.kafka.streams.processor.api.ProcessorContext;
import org.apache.kafka.streams.processor.api.Record;
import org.apache.kafka.streams.state.KeyValueStore;
import org.apache.kafka.streams.state.StoreBuilder;
import org.apache.kafka.streams.state.Stores;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.EnableKafkaStreams;
import org.springframework.kafka.annotation.KafkaStreamsDefaultConfiguration;
import org.springframework.kafka.config.KafkaStreamsConfiguration;
import org.springframework.kafka.support.serializer.JsonSerde;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

import static org.apache.kafka.streams.StreamsConfig.*;

@Configuration
@Profile("!test")
@EnableKafkaStreams
@Slf4j
public class MatchingEngineTopology {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean(name = KafkaStreamsDefaultConfiguration.DEFAULT_STREAMS_CONFIG_BEAN_NAME)
    public KafkaStreamsConfiguration kStreamsConfig() {
        Map<String, Object> props = new HashMap<>();
        props.put(APPLICATION_ID_CONFIG, "trading-engine-streams");
        props.put(BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass().getName());
        return new KafkaStreamsConfiguration(props);
    }

    @Bean
    public KStream<String, OrderRequest> matchingStream(StreamsBuilder streamsBuilder, ObjectMapper objectMapper) {
        Serde<OrderRequest> orderRequestSerde = new JsonSerde<>(OrderRequest.class, objectMapper);
        Serde<Trade> tradeSerde = new JsonSerde<>(Trade.class, objectMapper);
        Serde<OrderBookSnapshot> orderBookSnapshotSerde = new JsonSerde<>(OrderBookSnapshot.class, objectMapper);
        Serde<OrderBookState> orderBookStateSerde = new JsonSerde<>(OrderBookState.class, objectMapper);

        StoreBuilder<KeyValueStore<String, OrderBookState>> orderBookStoreBuilder = Stores.keyValueStoreBuilder(
                Stores.persistentKeyValueStore(STORE_NAME),
                Serdes.String(),
                orderBookStateSerde
        );
        streamsBuilder.addStateStore(orderBookStoreBuilder);

        KStream<String, OrderRequest> orderStream = streamsBuilder.stream("incoming-orders",
                Consumed.with(Serdes.String(), orderRequestSerde));

        KStream<String, Object> resultStream = orderStream.process(MatchingProcessor::new, STORE_NAME);

        resultStream.filter((k, v) -> v instanceof Trade)
                .mapValues(v -> (Trade) v)
                .to("trades", Produced.with(Serdes.String(), tradeSerde));

        resultStream.filter((k, v) -> v instanceof OrderBookSnapshot)
                .mapValues(v -> (OrderBookSnapshot) v)
                .to("orderbook-snapshots", Produced.with(Serdes.String(), orderBookSnapshotSerde));

        return orderStream;
    }

    private static final String STORE_NAME = "order-book-store";
    private static final String GLOBAL_KEY = "GLOBAL_BOOK";
    private static final BigDecimal MAX_SIDE_VOLUME = new BigDecimal("500.0");
    private static final UUID SYSTEM_ACCOUNT_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private static class MatchingProcessor extends ContextualProcessor<String, OrderRequest, String, Object> {
        private KeyValueStore<String, OrderBookState> stateStore;

        @Override
        public void init(ProcessorContext<String, Object> context) {
            super.init(context);
            this.stateStore = context.getStateStore(STORE_NAME);
        }

        @Override
        public void process(Record<String, OrderRequest> record) {
            OrderRequest order = record.value();
            log.info("Processing order in Kafka Streams: {}", order.courierId());

            OrderBookState state = stateStore.get(GLOBAL_KEY);
            if (state == null) {
                state = new OrderBookState();
            }

            // Load into PriorityQueues for matching
            PriorityQueue<OrderRequest> buyOrders = createBuyQueue();
            PriorityQueue<OrderRequest> sellOrders = createSellQueue();
            buyOrders.addAll(state.getBuyOrders());
            sellOrders.addAll(state.getSellOrders());

            if (order.type() == OrderRequest.OrderType.BUY) {
                buyOrders.add(order);
            } else {
                sellOrders.add(order);
            }

            matchOrders(buyOrders, sellOrders, state);
            clearExcessLiquidity(buyOrders, sellOrders, state);

            // Save state back
            state.setBuyOrders(buyOrders.stream().sorted(buyOrders.comparator()).toList());
            state.setSellOrders(sellOrders.stream().sorted(sellOrders.comparator()).toList());
            stateStore.put(GLOBAL_KEY, state);

            // Forward Snapshot
            OrderBookSnapshot snapshot = new OrderBookSnapshot(state.getBuyOrders(), state.getSellOrders());
            context().forward(new Record<>(record.key(), snapshot, record.timestamp()));
        }

        private void matchOrders(PriorityQueue<OrderRequest> buyOrders, PriorityQueue<OrderRequest> sellOrders, OrderBookState state) {
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

                BigDecimal executionPrice = determineExecutionPrice(highestBuy, lowestSell, state.getLastTradedPrice());
                BigDecimal executionAmount = highestBuy.amount().min(lowestSell.amount());

                Trade trade = new Trade(highestBuy.courierId(), lowestSell.courierId(), executionPrice, executionAmount);
                state.setLastTradedPrice(executionPrice);

                log.info("Trade Executed in Streams! Price: {}, Amount: {}", executionPrice, executionAmount);

                // Forward Trade
                context().forward(new Record<>(highestBuy.courierId().toString(), trade, context().currentSystemTimeMs()));

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

        private void clearExcessLiquidity(PriorityQueue<OrderRequest> buyOrders, PriorityQueue<OrderRequest> sellOrders, OrderBookState state) {
            clearSide(buyOrders, state, true);
            clearSide(sellOrders, state, false);
        }

        private void clearSide(PriorityQueue<OrderRequest> queue, OrderBookState state, boolean isBuy) {
            BigDecimal totalVolume = queue.stream()
                    .map(OrderRequest::amount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (totalVolume.compareTo(MAX_SIDE_VOLUME) <= 0) {
                return;
            }

            log.info("Total {} volume {} exceeds limit {}. Clearing oldest orders.", 
                    isBuy ? "BUY" : "SELL", totalVolume, MAX_SIDE_VOLUME);

            // Sort by age (timestamp) to clear oldest first
            List<OrderRequest> ordersByAge = new ArrayList<>(queue);
            ordersByAge.sort(Comparator.comparing(OrderRequest::timestamp));

            while (totalVolume.compareTo(MAX_SIDE_VOLUME) > 0 && !ordersByAge.isEmpty()) {
                OrderRequest oldest = ordersByAge.remove(0);
                queue.remove(oldest);
                totalVolume = totalVolume.subtract(oldest.amount());

                BigDecimal price = oldest.price() != null ? oldest.price() : state.getLastTradedPrice();
                Trade trade;
                if (isBuy) {
                    trade = new Trade(oldest.courierId(), SYSTEM_ACCOUNT_ID, price, oldest.amount());
                } else {
                    trade = new Trade(SYSTEM_ACCOUNT_ID, oldest.courierId(), price, oldest.amount());
                }
                
                state.setLastTradedPrice(price);
                context().forward(new Record<>(oldest.courierId().toString(), trade, context().currentSystemTimeMs()));
                log.info("System cleared {} liquidity from {}. Remaining volume: {}", 
                        isBuy ? "BUY" : "SELL", oldest.courierId(), totalVolume);
            }
        }

        private BigDecimal determineExecutionPrice(OrderRequest buy, OrderRequest sell, BigDecimal lastTradedPrice) {
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
            return buy.timestamp().isBefore(sell.timestamp()) ? buy.price() : sell.price();
        }

        private PriorityQueue<OrderRequest> createBuyQueue() {
            return new PriorityQueue<>(
                    Comparator.comparing((OrderRequest o) -> o.executionMode() == OrderRequest.ExecutionMode.MARKET ? 0 : 1)
                            .thenComparing(Comparator.comparing(OrderRequest::price, Comparator.nullsLast(Comparator.reverseOrder())))
                            .thenComparing(OrderRequest::timestamp)
            );
        }

        private PriorityQueue<OrderRequest> createSellQueue() {
            return new PriorityQueue<>(
                    Comparator.comparing((OrderRequest o) -> o.executionMode() == OrderRequest.ExecutionMode.MARKET ? 0 : 1)
                            .thenComparing(Comparator.comparing(OrderRequest::price, Comparator.nullsLast(Comparator.naturalOrder())))
                            .thenComparing(OrderRequest::timestamp)
            );
        }
    }
}
