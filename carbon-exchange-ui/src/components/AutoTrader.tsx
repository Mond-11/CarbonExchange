import { useState, useEffect } from 'react';
import { placeOrder } from '../services/api';
import type { OrderRequest } from '../types';

/**
 * A component that simulates a market maker bot.
 * Automatically generates and places random buy and sell orders at a specified speed.
 */
export default function AutoTrader() {
    const [isActive, setIsActive] = useState(false);
    const [speed, setSpeed] = useState(2); // Default: 2 orders per second

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            const type = Math.random() > 0.5 ? 'BUY' : 'SELL';

            const randomPrice = (12.00 + (Math.random() * 4 - 2)).toFixed(2);

            const randomAmount = (Math.random() * 4 + 1).toFixed(1);

            const orderPayload: OrderRequest = {
                courierId: crypto.randomUUID(),
                type: type,
                executionMode: 'LIMIT',
                price: parseFloat(randomPrice),
                amount: parseFloat(randomAmount),
                timestamp: new Date().toISOString()
            };

            placeOrder(orderPayload).catch(err => console.error("Bot encountered network error:", err));

        }, 1000 / speed);

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
                        disabled={isActive}
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