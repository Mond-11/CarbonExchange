import { useState } from 'react';
import { Form, Button, ButtonGroup, InputGroup, Alert } from 'react-bootstrap';
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
    const [status, setStatus] = useState<{ type: 'success' | 'danger', message: string } | null>(null);
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
            setStatus({ type: 'success', message: `Successfully submitted ${type} order!` });
            setPrice('');
            setAmount('');

            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            setStatus({ type: 'danger', message: "Error: Could not reach the broker." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h5 className="mb-3 fw-bold text-body">Place Order</h5>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label className="small text-secondary fw-bold text-uppercase">Action</Form.Label>
                    <ButtonGroup className="w-100 shadow-sm">
                        <Button
                            variant={type === 'BUY' ? 'success' : 'outline-secondary'}
                            onClick={() => setType('BUY')}
                            className="fw-bold"
                        >
                            BUY
                        </Button>
                        <Button
                            variant={type === 'SELL' ? 'danger' : 'outline-secondary'}
                            onClick={() => setType('SELL')}
                            className="fw-bold"
                        >
                            SELL
                        </Button>
                    </ButtonGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label className="small text-secondary fw-bold text-uppercase">Order Type</Form.Label>
                    <ButtonGroup className="w-100 shadow-sm">
                        <Button
                            variant={executionMode === 'LIMIT' ? 'primary' : 'outline-secondary'}
                            onClick={() => setExecutionMode('LIMIT')}
                            size="sm"
                        >
                            LIMIT
                        </Button>
                        <Button
                            variant={executionMode === 'MARKET' ? 'warning' : 'outline-secondary'}
                            onClick={() => setExecutionMode('MARKET')}
                            size="sm"
                        >
                            MARKET
                        </Button>
                    </ButtonGroup>
                </Form.Group>

                {executionMode === 'LIMIT' && (
                    <Form.Group className="mb-3" controlId="price">
                        <Form.Label className="small text-secondary fw-bold text-uppercase">Price</Form.Label>
                        <InputGroup size="sm" className="shadow-sm">
                            <InputGroup.Text className="text-secondary border-secondary">$</InputGroup.Text>
                            <Form.Control
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                required
                                className="border-secondary"
                            />
                        </InputGroup>
                    </Form.Group>
                )}

                <Form.Group className="mb-4" controlId="amount">
                    <Form.Label className="small text-secondary fw-bold text-uppercase">Amount</Form.Label>
                    <InputGroup size="sm" className="shadow-sm">
                        <Form.Control
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.0"
                            required
                            className="border-secondary"
                        />
                        <InputGroup.Text className="text-secondary border-secondary">Credits</InputGroup.Text>
                    </InputGroup>
                </Form.Group>

                <Button 
                    variant={type === 'BUY' ? 'success' : 'danger'} 
                    type="submit" 
                    className="w-100 fw-bold py-2 shadow" 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>Sending...</>
                    ) : (
                        `PLACE ${type} ORDER`
                    )}
                </Button>

                {status && (
                    <Alert variant={status.type} className="mt-3 small py-2 text-center">
                        {status.message}
                    </Alert>
                )}
            </Form>
        </div>
    );
}