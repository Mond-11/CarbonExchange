package com.carbonexchange.tradingengine;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

public class LoadTest {

    private static final String API_URL = "http://localhost:8080/api/v1/exchange/order";
    private static final int TOTAL_REQUESTS = 1000;

    public static void main(String[] args) throws InterruptedException {
        System.out.println("Starting Stress Test: Firing " + TOTAL_REQUESTS + " concurrent orders...");

        HttpClient client = HttpClient.newHttpClient();
        Random random = new Random();
        CountDownLatch latch = new CountDownLatch(TOTAL_REQUESTS);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < TOTAL_REQUESTS; i++) {
                executor.submit(() -> {
                    try {
                        String type = random.nextBoolean() ? "BUY" : "SELL";
                        double amount = 1.0 + (random.nextDouble() * 10.0); // Random amount between 1 and 11
                        double price = 5.0 + (random.nextDouble() * 15.0);  // Random price between 5 and 20

                        String jsonPayload = """
                                {
                                  "courierId": "%s",
                                  "type": "%s",
                                  "amount": %.2f,
                                  "price": %.2f,
                                  "timestamp": "%s"
                                }
                                """.formatted(
                                UUID.randomUUID().toString(),
                                type,
                                amount,
                                price,
                                Instant.now().toString()
                        );

                        HttpRequest request = HttpRequest.newBuilder()
                                .uri(URI.create(API_URL))
                                .header("Content-Type", "application/json")
                                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                                .build();

                        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                        if (response.statusCode() == 202) {
                            successCount.incrementAndGet();
                        } else {
                            failCount.incrementAndGet();
                        }
                    } catch (Exception e) {
                        failCount.incrementAndGet();
                    } finally {
                        latch.countDown();
                    }
                });
            }
        }

        // Wait for all 1,000 threads to finish sending
        latch.await();
        long endTime = System.currentTimeMillis();

        System.out.println("--- STRESS TEST COMPLETE ---");
        System.out.println("Total Time: " + (endTime - startTime) + "ms");
        System.out.println("Successful REST Submissions (202 Accepted): " + successCount.get());
        System.out.println("Failed Submissions: " + failCount.get());
        System.out.println("Check your Spring Boot console to watch the Kafka consumer process the backlog!");
    }
}