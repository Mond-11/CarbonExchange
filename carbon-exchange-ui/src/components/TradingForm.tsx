import { useState } from 'react';
import { placeOrder } from '../services/api';
import type { OrderType, OrderRequest, ExecutionMode, User } from '../types';

interface TradingFormProps {
    user: User;
}

/**
 * A form component for placing buy or sell orders on the exchange.
 */
export default function TradingForm({ user }: TradingFormProps) {
    const [type, setType] = useState<OrderType>('BUY');
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('LIMIT');
    const [price, setPrice] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [status, setStatus] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((executionMode === 'LIMIT' && !price) || !amount) return;

        setIsSubmitting(true);
        setStatus(null);

        const orderPayload: OrderRequest = {
            courierId: user.id,
            type: type,
            executionMode: executionMode,
            price: executionMode === 'LIMIT' ? parseFloat(price) : null,
            amount: parseFloat(amount),
            timestamp: new Date().toISOString()
        };

        try {
            await placeOrder(orderPayload);
            setStatus(`Successfully submitted ${type} order!`);
            setPrice('');
            setAmount('');

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
                    <label>Order Type</label>
                    <div className="button-group">
                        <button
                            type="button"
                            className={`type-btn ${executionMode === 'LIMIT' ? 'active-limit' : ''}`}
                            onClick={() => setExecutionMode('LIMIT')}
                        >
                            LIMIT
                        </button>
                        <button
                            type="button"
                            className={`type-btn ${executionMode === 'MARKET' ? 'active-market' : ''}`}
                            onClick={() => setExecutionMode('MARKET')}
                        >
                            MARKET
                        </button>
                    </div>
                </div>

                {executionMode === 'LIMIT' && (
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
                )}

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