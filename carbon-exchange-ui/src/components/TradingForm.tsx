// src/components/TradingForm.tsx
import { useState } from 'react';
import { placeOrder } from '../services/api';
import type { OrderType, OrderRequest } from '../types';

export default function TradingForm() {
    const [type, setType] = useState<OrderType>('BUY');
    const [price, setPrice] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [status, setStatus] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent the browser from refreshing the page
        if (!price || !amount) return;

        setIsSubmitting(true);
        setStatus(null);

        // Construct the exact DTO the Spring Boot backend expects
        const orderPayload: OrderRequest = {
            courierId: crypto.randomUUID(), // Automatically generate a UUID
            type: type,
            price: parseFloat(price),
            amount: parseFloat(amount),
            timestamp: new Date().toISOString() // Format as Java Instant
        };

        try {
            await placeOrder(orderPayload);
            setStatus(`Successfully submitted ${type} order!`);
            // Clear the inputs so the user can quickly type the next trade
            setPrice('');
            setAmount('');

            // Clear the success message after 2 seconds
            setTimeout(() => setStatus(null), 2000);
        } catch (error) {
            setStatus("Error: Could not reach the broker.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="panel trading-panel">
            <h2>Place Order</h2>
            <form onSubmit={handleSubmit} className="trading-form">

                <div className="form-group">
                    <label>Action</label>
                    <div className="button-group">
                        <button
                            type="button"
                            className={`type-btn ${type === 'BUY' ? 'active-buy' : ''}`}
                            onClick={() => setType('BUY')}
                        >
                            BUY
                        </button>
                        <button
                            type="button"
                            className={`type-btn ${type === 'SELL' ? 'active-sell' : ''}`}
                            onClick={() => setType('SELL')}
                        >
                            SELL
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="price">Price ($)</label>
                    <input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 10.50"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="amount">Amount (Credits)</label>
                    <input
                        id="amount"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 5"
                        required
                    />
                </div>

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'SUBMIT ORDER'}
                </button>

                {status && <div className="status-message">{status}</div>}
            </form>
        </section>
    );
}