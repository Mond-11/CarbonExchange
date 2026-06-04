// src/components/AutoTrader.tsx
import { useState, useEffect } from 'react';
import { placeOrder } from '../services/api';
import type { OrderRequest } from '../types';

export default function AutoTrader() {
    const [isActive, setIsActive] = useState(false);
    const [speed, setSpeed] = useState(2); // Default: 2 orders per second

    useEffect(() => {
        // If the bot is turned off, do nothing
        if (!isActive) return;

        // Set up the automated firing loop
        const interval = setInterval(() => {

            // 1. Randomize the Order Type (50/50 chance)
            const type = Math.random() > 0.5 ? 'BUY' : 'SELL';

            // 2. Generate a realistic price (Creates a tight market around $12.00 to guarantee matches)
            // This generates a random price between $10.00 and $14.00
            const randomPrice = (12.00 + (Math.random() * 4 - 2)).toFixed(2);

            // 3. Randomize the amount between 1 and 5 credits
            const randomAmount = (Math.random() * 4 + 1).toFixed(1);

            // 4. Construct the payload
            const orderPayload: OrderRequest = {
                courierId: crypto.randomUUID(), // Simulate a unique user every time
                type: type,
                price: parseFloat(randomPrice),
                amount: parseFloat(randomAmount),
                timestamp: new Date().toISOString()
            };

            // 5. Fire it at the Spring Boot Backend silently
            placeOrder(orderPayload).catch(err => console.error("Bot encountered network error:", err));

        }, 1000 / speed); // Convert orders-per-second to millisecond delay

        // Cleanup the interval if the component unmounts or state changes
        return () => clearInterval(interval);

    }, [isActive, speed]);

    return (
        <section className="panel auto-trader-panel">
            <h2>Market Maker Bot</h2>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '15px' }}>
                Simulates active market participants to generate real-time order flow and execution data.
            </p>

            <div className="bot-controls">
                <div className="speed-control">
                    <label>Speed: {speed} orders/sec</label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        disabled={isActive} // Lock the slider while running
                    />
                </div>

                <button
                    className={`bot-btn ${isActive ? 'bot-active' : 'bot-inactive'}`}
                    onClick={() => setIsActive(!isActive)}
                >
                    {isActive ? 'STOP BOT' : 'START BOT'}
                </button>
            </div>
        </section>
    );
}