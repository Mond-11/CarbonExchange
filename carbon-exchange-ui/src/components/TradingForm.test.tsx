import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TradingForm from './TradingForm';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
    placeOrder: vi.fn(),
}));

describe('TradingForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render form elements', () => {
        render(<TradingForm />);
        expect(screen.getByText('Place Order')).toBeInTheDocument();
        expect(screen.getByLabelText('Price ($)')).toBeInTheDocument();
        expect(screen.getByLabelText('Amount (Credits)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'SUBMIT ORDER' })).toBeInTheDocument();
    });

    it('should change order type', () => {
        render(<TradingForm />);
        const sellBtn = screen.getByRole('button', { name: 'SELL' });
        fireEvent.click(sellBtn);
        expect(sellBtn).toHaveClass('active-sell');
        
        const buyBtn = screen.getByRole('button', { name: 'BUY' });
        fireEvent.click(buyBtn);
        expect(buyBtn).toHaveClass('active-buy');
    });

    it('should submit order successfully', async () => {
        vi.mocked(api.placeOrder).mockResolvedValue(undefined);
        render(<TradingForm />);

        fireEvent.change(screen.getByLabelText('Price ($)'), { target: { value: '10.50' } });
        fireEvent.change(screen.getByLabelText('Amount (Credits)'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'SUBMIT ORDER' }));

        await waitFor(() => {
            expect(api.placeOrder).toHaveBeenCalledWith(expect.objectContaining({
                price: 10.50,
                amount: 5,
                type: 'BUY'
            }));
        });

        expect(screen.getByText('Successfully submitted BUY order!')).toBeInTheDocument();
    });

    it('should handle submission error', async () => {
        vi.mocked(api.placeOrder).mockRejectedValue(new Error('Network Error'));
        render(<TradingForm />);

        fireEvent.change(screen.getByLabelText('Price ($)'), { target: { value: '10.50' } });
        fireEvent.change(screen.getByLabelText('Amount (Credits)'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'SUBMIT ORDER' }));

        await waitFor(() => {
            expect(screen.getByText('Error: Could not reach the broker.')).toBeInTheDocument();
        });
    });
});
