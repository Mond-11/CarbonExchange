import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import PriceChart from './PriceChart';

// Mock recharts
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: ({ children }: any) => <div>{children}</div>,
    Line: () => <div>Line</div>,
    XAxis: () => <div>XAxis</div>,
    YAxis: () => <div>YAxis</div>,
    CartesianGrid: () => <div>Grid</div>,
    Tooltip: () => <div>Tooltip</div>,
}));

describe('PriceChart Component', () => {
    const mockTrades = [
        { id: '1', price: 15.5, amount: 10, executedAt: new Date().toISOString(), buyerId: 'b', sellerId: 's' }
    ];

    it('should render without crashing', () => {
        const { container } = render(<PriceChart trades={mockTrades} theme="dark" />);
        expect(container).toBeInTheDocument();
    });
});
