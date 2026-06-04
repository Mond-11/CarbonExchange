# Carbon Credit Exchange Platform

A high-performance, real-time marketplace designed to facilitate the trading of carbon credits between logistics providers. The platform specifically caters to the exchange between green transportation fleets (e.g., e-bike operators) who sell credits and traditional logistics companies (e.g., gas-powered van fleets) who purchase credits to offset their carbon footprint.

## Features

- **Continuous Double Auction (CDA) Engine**: A robust matching engine that automatically pairs buy and sell orders based on price-time priority.
- **Real-Time Data Streaming**: Live updates for the order book and executed trades via WebSockets (STOMP).
- **Asynchronous Order Processing**: High-throughput order handling using Apache Kafka for message queuing.
- **Automated Trading**: Built-in support for simulated market activity to maintain liquidity.
- **Modern Dashboard**: A responsive React-based UI for monitoring market depth and recent transactions.

## Tech Stack

### Backend (`trading-engine`)
- **Language**: Java 21
- **Framework**: Spring Boot 4.0.x
- **Messaging**: Apache Kafka (Order queuing)
- **Real-time**: Spring WebSocket with STOMP
- **Database**: PostgreSQL (Persistence of trades)
- **ORM**: Spring Data JPA / Hibernate

### Frontend (`carbon-exchange-ui`)
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **State Management**: React Hooks
- **Communication**: STOMP.js (WebSockets), Fetch API (REST)

## Project Structure

```text
.
├── trading-engine         # Spring Boot matching engine and API
└── carbon-exchange-ui      # React-based trading dashboard
```

## Getting Started

### Prerequisites
- JDK 21
- Node.js (v18+)
- Docker and Docker Compose

### Setup Infrastructure
Run the required services (PostgreSQL, Kafka, Zookeeper) using Docker:
```bash
cd trading-engine
docker-compose up -d
```

### Run the Backend
1. Configure environment variables (refer to `trading-engine/.env.example`).
2. Build and run the Spring Boot application:
```bash
cd trading-engine
./mvnw clean install
./mvnw spring-boot:run
```

### Run the Frontend
1. Navigate to the UI directory:
```bash
cd carbon-exchange-ui
npm install
npm run dev
```
2. Open `http://localhost:5173` in your browser.

## TODO & Future Improvements

To enhance the project's academic depth and business utility, the following improvements are proposed:

### 1. Advanced Matching Logic
- [x] **Partial Order Matching**: Implement order splitting where a large order can be partially filled by multiple smaller opposite orders.
- [x] **Limit vs. Market Orders**: Introduce market orders that execute immediately at the best available price.

### 2. Economic & Business Logic Quirks
- **Carbon Dividend System**: Implement a mechanism where a small transaction fee (e.g., 0.5%) is collected and redistributed periodically to "Green" couriers as an incentive.
- **Dynamic Pricing Curves**: Integrate an AMM (Automated Market Maker) logic for low-liquidity pairs to ensure there's always a price.
- **Volatility Safeguards**: Implement "Circuit Breakers" that pause trading if the price of carbon credits fluctuates beyond a certain percentage in a short timeframe.

### 3. Verification & Governance
- **Proof of Offset**: Integrate a mock blockchain or third-party API to verify that the carbon credits being sold are legitimate and haven't been double-sold.
- **Courier Reputation Score**: Develop an algorithm that ranks couriers based on their "Real-world Green Efficiency" and trading reliability.

### 4. Technical Enhancements
- **Kafka Streams**: Move the matching logic into a Kafka Streams application for better scalability and fault tolerance.
- **End-to-End Testing**: Expand Vitest and JUnit coverage to include integration tests for the full order flow from UI to Database.