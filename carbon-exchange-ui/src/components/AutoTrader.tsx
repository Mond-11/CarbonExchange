import { useState, useEffect, useRef } from 'react';
import { Button, Form, ProgressBar, Badge, Alert } from 'react-bootstrap';
import { placeOrder } from '../services/api';
import { fetchAllUsers } from '../services/auth';
import type { OrderRequest, User } from '../types';

/**
 * A component that simulates a market maker bot.
 * Automatically generates and places buy and sell orders.
 * Now takes existing listings into account to provide realistic liquidity.
 * 
 * @param props.orderBook current order book snapshot for market analysis
 */
export default function AutoTrader({ orderBook = { buyOrders: [], sellOrders: [] } }: { orderBook?: any }) {
    const [isActive, setIsActive] = useState(false);
    const [speed, setSpeed] = useState(2); // Default: 2 orders per second
    const [ordersPlaced, setOrdersPlaced] = useState(0);
    const [lastError, setLastError] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const orderBookRef = useRef(orderBook);

    useEffect(() => {
        orderBookRef.current = orderBook;
    }, [orderBook]);

    useEffect(() => {
        fetchAllUsers().then(setUsers).catch(err => {
            console.error("Failed to fetch users for bot:", err);
            setLastError("Failed to fetch users");
        });
    }, []);

    useEffect(() => {
        if (!isActive || users.length === 0) return;

        const interval = setInterval(() => {
            const currentBook = orderBookRef.current;
            const randomUser = users[Math.floor(Math.random() * users.length)];
            
            const allOrders = [...currentBook.buyOrders, ...currentBook.sellOrders];
            // 40% chance to target an existing listing (autotrading)
            const isTaker = allOrders.length > 0 && Math.random() < 0.4;

            let type: 'BUY' | 'SELL';
            let price: number;
            let amount: number;

            if (isTaker) {
                // Priority increases as listing ages
                const sortedByAge = [...allOrders].sort((a, b) => 
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
                
                // Weighted random selection based on age (in seconds)
                const now = Date.now();
                const weighted = sortedByAge.map(o => ({
                    order: o,
                    weight: Math.max(1, (now - new Date(o.timestamp).getTime()) / 1000)
                }));
                const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
                let r = Math.random() * totalWeight;
                let target = weighted[0].order;
                for (const w of weighted) {
                    if (r < w.weight) {
                        target = w.order;
                        break;
                    }
                    r -= w.weight;
                }

                type = target.type === 'BUY' ? 'SELL' : 'BUY';
                // To guarantee a trade, match at target price
                // For MARKET orders, use a random price near market
                price = target.executionMode === 'MARKET' ? 12.00 : target.price!;
                amount = target.amount;
            } else {
                // Maker logic: random orders but respecting the spread
                type = Math.random() > 0.5 ? 'BUY' : 'SELL';
                const bestBid = currentBook.buyOrders[0]?.price || 11.80;
                const bestAsk = currentBook.sellOrders[0]?.price || 12.20;

                if (type === 'BUY') {
                    // Place bid slightly below or at best ask to potentially trade, 
                    // or lower to be a maker.
                    price = parseFloat((bestAsk - (Math.random() * 0.5)).toFixed(2));
                } else {
                    price = parseFloat((bestBid + (Math.random() * 0.5)).toFixed(2));
                }
                amount = parseFloat((Math.random() * 4 + 1).toFixed(1));
            }

            const orderPayload: OrderRequest = {
                courierId: randomUser.id,
                type: type,
                executionMode: 'LIMIT',
                price: price,
                amount: amount,
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