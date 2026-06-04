---
sessionId: session-260604-151939-8w6k
---

# Requirements

### Overview & Goals
The goal is to finalize the coursework requirements by completing the documentation, ensuring full unit test coverage (especially fixing the failing frontend dashboard tests), and providing a comprehensive project guide with a roadmap for future improvements including advanced trading features.

### Scope
- **Documentation**: 
  - Complete Javadoc for remaining backend files (`TradingEngineApplication.java`, `OrderBookSnapshot.java`, `MatchingEngine.java`, and test files like `LoadTest.java`).
  - Add TSDoc to `main.tsx`, `types/index.ts`, and frontend test files.
  - Verify all non-essential comments are removed.
- **Testing**: 
  - Fix `App.test.tsx` which currently fails due to incorrect `@stomp/stompjs` mocking.
  - Implement `OrderRequestTest.java` to test record validation logic.
  - Ensure 100% pass rate for all unit tests.
- **Documentation Files**: 
  - Create `README.md` with project architecture and setup.
  - Create `TODO.md` with academic and business logic improvements (Partial fills, Circuit breakers, etc.).

# Technical Design

### Current Implementation
- Most core business logic in the `trading-engine` is documented and tested.
- Frontend components have basic tests, but `App.test.tsx` is failing due to incorrect WebSocket client mocking.
- Project lacks a central entry point for documentation (README).

### Proposed Changes
- **Backend Documentation**: Add Javadoc to `TradingEngineApplication.java`, `OrderBookSnapshot.java`, and `MatchingEngine.java`.
- **Frontend Documentation**: Add TSDoc to `main.tsx` and `types/index.ts`.
- **Frontend Test Fix**: Resolve `App.test.tsx` failures by ensuring the `@stomp/stompjs` Client mock correctly handles constructor calls and life-cycle methods.
- **Backend Test Addition**: Create `OrderRequestTest.java` to verify that `IllegalArgumentException` is thrown for invalid price/amount.
- **Documentation**:
    - `README.md`: Detailed guide covering the Carbon Credit Exchange architecture (Kafka, WebSockets, React).
    - `TODO.md`: Roadmap for "Academic Ingenuity" features:
        - **Partial Fills**: Update `MatchingEngine` to handle orders that aren't fully filled.
        - **Volatility Circuit Breaker**: Mechanism to pause trading during extreme price swings.
        - **Fee Module**: Model for exchange revenue.
        - **Advanced Carbon Logic**: Credits with expiration dates or certification levels.

### File Structure Changes
- `trading-engine/src/test/java/com/carbonexchange/tradingengine/domain/market/model/OrderRequestTest.java` (Added)
- `README.md` (Added)
- `TODO.md` (Added)

# Testing

### Validation Approach
- Run `mvn test` for the backend to ensure all unit tests pass.
- Run `npm test` for the frontend to ensure all component and service tests pass.

### Key Scenarios
- `App.test.tsx`: Verify dashboard rendering and WebSocket connection handling.
- `OrderRequestTest.java`: Verify that invalid amounts or prices throw `IllegalArgumentException`.