package com.carbonexchange.tradingengine;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.ActiveProfiles;

import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.kafka.config.StreamsBuilderFactoryBean;

@SpringBootTest(properties = {
    "spring.kafka.bootstrap-servers=localhost:9092",
    "spring.datasource.url=jdbc:h2:mem:db",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@ActiveProfiles("test")
public class DiagnosticTest {

    @Test
    void diagnostic() {
        System.out.println("[DEBUG_LOG] Context loaded successfully!");
    }
}
