import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TradingForm from './TradingForm';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
    placeOrder: vi.fn(),
}));

const mockUser = {
    id: 'user-123',
    username: 'testuser',
    moneyBalance: 1000,
    creditBalance: 100
};

describe('TradingForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render form elements', () => {
        render(<TradingForm user={mockUser} />);
        expect(screen.getByText('Place Order')).toBeInTheDocument();
        expect(screen.getByLabelText('Price ($)')).toBeInTheDocument();
        expect(screen.getByLabelText('Amount (Credits)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'SUBMIT ORDER' })).toBeInTheDocument();
    });

    it('should change order type', () => {
        render(<TradingForm user={mockUser} />);
        const sellBtn = screen.getByRole('button', { name: 'SELL' });
        fireEvent.click(sellBtn);
        expect(sellBtn).toHaveClass('active-sell');
        
        const buyBtn = screen.getByRole('button', { name: 'BUY' });
        fireEvent.click(buyBtn);
        expect(buyBtn).toHaveClass('active-buy');
    });

    it('should change execution mode', () => {
        render(<TradingForm user={mockUser} />);
        const marketBtn = screen.getByRole('button', { name: 'MARKET' });
        fireEvent.click(marketBtn);
        expect(marketBtn).toHaveClass('active-market');
        expect(screen.queryByLabelText('Price ($)')).not.toBeInTheDocument();
        
        const limitBtn = screen.getByRole('button', { name: 'LIMIT' });
        fireEvent.click(limitBtn);
        expect(limitBtn).toHaveClass('active-limit');
        expect(screen.getByLabelText('Price ($)')).toBeInTheDocument();
    });

    it('should submit order successfully', async () => {
        vi.mocked(api.placeOrder).mockResolvedValue(undefined);
        render(<TradingForm user={mockUser} />);

        fireEvent.change(screen.getByLabelText('Price ($)'), { target: { value: '10.50' } });
        fireEvent.change(screen.getByLabelText('Amount (Credits)'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'SUBMIT ORDER' }));

        await waitFor(() => {
            expect(api.placeOrder).toHaveBeenCalledWith(expect.objectContaining({
                courierId: 'user-123',
                price: 10.50,
                amount: 5,
                type: 'BUY',
                executionMode: 'LIMIT'
            }));
        });

        expect(screen.getByText('Successfully submitted BUY order!')).toBeInTheDocument();
    });

    it('should submit market order successfully', async () => {
        vi.mocked(api.placeOrder).mockResolvedValue(undefined);
        render(<TradingForm user={mockUser} />);

        fireEvent.click(screen.getByRole('button', { name: 'MARKET' }));
        fireEvent.change(screen.getByLabelText('Amount (Credits)'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'SUBMIT ORDER' }));

        await waitFor(() => {
            expect(api.placeOrder).toHaveBeenCalledWith(expect.objectContaining({
                courierId: 'user-123',
                price: null,
                amount: 5,
                type: 'BUY',
                executionMode: 'MARKET'
            }));
        });
    });

    it('should handle submission error', async () => {
        vi.mocked(api.placeOrder).mockRejectedValue(new Error('Network Error'));
        render(<TradingForm user={mockUser} />);

        fireEvent.change(screen.getByLabelText('Price ($)'), { target: { value: '10.50' } });
        fireEvent.change(screen.getByLabelText('Amount (Credits)'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'SUBMIT ORDER' }));

        await waitFor(() => {
            expect(screen.getByText('Error: Could not reach the broker.')).toBeInTheDocument();
        });
    });
});
