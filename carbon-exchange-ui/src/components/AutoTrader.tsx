import { useState, useEffect } from 'react';
import { Button, Form, ProgressBar, Badge, Alert } from 'react-bootstrap';
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

    }, [isActive, speed, users]);

    return (
        <div>
            <h5 className="mb-2 fw-bold d-flex align-items-center gap-2 text-body">
                Market Maker Bot
                <Badge bg={isActive ? 'success' : 'secondary'} pill style={{ fontSize: '0.6rem' }}>
                    {isActive ? 'RUNNING' : 'IDLE'}
                </Badge>
            </h5>
            <p className="text-secondary small mb-3">
                Simulates active market participants to generate real-time order flow and execution data.
            </p>

            <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                    <span className="small text-secondary fw-bold">Speed: {speed} orders/sec</span>
                    <span className="small text-secondary fw-bold">Total: {ordersPlaced}</span>
                </div>
                <Form.Range
                    min="1"
                    max="10"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    disabled={isActive}
                />
            </div>

            {isActive && (
                <ProgressBar 
                    animated 
                    now={100} 
                    variant="info" 
                    className="mb-3" 
                    style={{ height: '4px' }}
                />
            )}

            {lastError && (
                <Alert variant="danger" className="py-1 px-2 small mb-3">
                    {lastError}
                </Alert>
            )}

            <Button
                variant={isActive ? 'outline-danger' : 'outline-info'}
                className={`w-100 fw-bold py-2 ${isActive ? 'bot-active' : ''}`}
                onClick={() => {
                    setIsActive(!isActive);
                    if (!isActive) {
                        setOrdersPlaced(0);
                        setLastError(null);
                    }
                }}
            >
                {isActive ? 'STOP SIMULATION' : 'START SIMULATION'}
            </Button>
        </div>
    );
}