import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarketMetrics from './MarketMetrics';

describe('MarketMetrics Component', () => {
    const mockTrades = [
        { id: '1', price: 15.5, amount: 10, executedAt: new Date().toISOString(), buyerId: 'b', sellerId: 's' }
    ];
    const mockOrderBook = {
        buyOrders: [{ price: 15.0, amount: 5 }],
        sellOrders: [{ price: 16.0, amount: 5 }]
    };

    it('should display LTP correctly', () => {
        render(<MarketMetrics trades={mockTrades} orderBook={mockOrderBook as any} />);
        expect(screen.getByText(/Last Traded Price/i)).toBeInTheDocument();
        expect(screen.getByText(/\$15.50/i)).toBeInTheDocument();
    });

    it('should display spread correctly', () => {
        render(<MarketMetrics trades={mockTrades} orderBook={mockOrderBook as any} />);
        expect(screen.getByText(/Market Spread/i)).toBeInTheDocument();
        expect(screen.getByText(/\$1.00/i)).toBeInTheDocument();
    });

    it('should display volume correctly', () => {
        render(<MarketMetrics trades={mockTrades} orderBook={mockOrderBook as any} />);
        expect(screen.getByText(/Volume/i)).toBeInTheDocument();
        expect(screen.getByText(/10.0/)).toBeInTheDocument();
    });
});
