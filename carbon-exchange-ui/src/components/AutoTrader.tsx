import { useState, useEffect } from 'react';
import { placeOrder } from '../services/api';
import { fetchAllUsers } from '../services/auth';
import type { OrderRequest, User } from '../types';

/**
 * A component that simulates a market maker bot.
 * Automatically generates and places random buy and sell orders at a specified speed.
 */
export default function AutoTrader() {
    const [isActive, setIsActive] = useState(false);
    const [speed, setSpeed] = useState(2); // Default: 2 orders per second
    const [ordersPlaced, setOrdersPlaced] = useState(0);
    const [lastError, setLastError] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        fetchAllUsers().then(setUsers).catch(err => {
            console.error("Failed to fetch users for bot:", err);
            setLastError("Failed to fetch users");
        });
    }, []);

    useEffect(() => {
        if (!isActive || users.length === 0) return;

        const interval = setInterval(() => {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const type = Math.random() > 0.5 ? 'BUY' : 'SELL';

            const randomPrice = (12.00 + (Math.random() * 4 - 2)).toFixed(2);

            const randomAmount = (Math.random() * 4 + 1).toFixed(1);

            const orderPayload: OrderRequest = {
                courierId: randomUser.id,
                type: type,
                executionMode: 'LIMIT',
                price: parseFloat(randomPrice),
                amount: parseFloat(randomAmount),
                timestamp: new Date().toISOString()
            };

            placeOrder(orderPayload)
                .then(() => {
                    setOrdersPlaced(prev => prev + 1);
                    setLastError(null);
                })
                .catch(err => {
                    console.error("Bot encountered network error:", err);
                    setLastError(err.message || "Network Error");
                });

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
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.8rem' }}>
                    <span>Orders Placed: {ordersPlaced}</span>
                    {lastError && <span style={{ color: '#ff5252' }}>Error: {lastError}</span>}
                </div>
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
                    onClick={() => {
                        setIsActive(!isActive);
                        if (!isActive) {
                            setOrdersPlaced(0);
                            setLastError(null);
                        }
                    }}
                >
                    {isActive ? 'STOP BOT' : 'START BOT'}
                </button>
            </div>
        </section>
    );
}