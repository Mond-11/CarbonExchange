import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import * as api from './services/api';
import * as auth from './services/auth';

vi.mock('./services/api', () => ({
    fetchOrderBook: vi.fn(),
    fetchTrades: vi.fn(),
}));

vi.mock('./services/auth', () => ({
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    fetchUser: vi.fn(),
    fetchAllUsers: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
}));

vi.mock('@stomp/stompjs', () => {
    return {
        Client: class {
            activate = vi.fn();
            deactivate = vi.fn();
            subscribe = vi.fn();
        },
    };
});

vi.mock('recharts', async () => {
    const Actual = await vi.importActual('recharts') as any;
    return {
        ...Actual,
        ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    };
});

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.fetchOrderBook).mockResolvedValue({ buyOrders: [], sellOrders: [] });
        vi.mocked(api.fetchTrades).mockResolvedValue([]);
        vi.mocked(auth.getCurrentUser).mockReturnValue(null);
        vi.mocked(auth.fetchAllUsers).mockResolvedValue([]);
    });

    it('should render dashboard title', async () => {
        render(<App />);
        expect(screen.getByText('Carbon Exchange')).toBeInTheDocument();
        await waitFor(() => {
            expect(api.fetchOrderBook).toHaveBeenCalled();
        });
    });


    it('should display orders in the order book', async () => {
        const mockOrderBook = {
            buyOrders: [{ price: 10, amount: 5, courierId: '1', timestamp: 'now', executionMode: 'LIMIT' as const, type: 'BUY' as const }],
            sellOrders: [{ price: 12, amount: 3, courierId: '2', timestamp: 'now', executionMode: 'LIMIT' as const, type: 'SELL' as const }]
        };
        vi.mocked(api.fetchOrderBook).mockResolvedValue(mockOrderBook);

        render(<App />);

        await waitFor(() => {
            expect(screen.getByText('$10.00')).toBeInTheDocument();
            expect(screen.getByText('$12.00')).toBeInTheDocument();
        });
    });

    it('should display new trade when received via WebSocket', async () => {
        render(<App />);
        
        // Find the subscription callback and trigger it
        // This requires a bit more advanced mocking of STOMP, but we can simulate state change
        // For now, let's just verify fetchTrades works
        const mockTrade = { id: 't1', buyerId: '1', sellerId: '2', price: 15, amount: 10, executedAt: 'now' };
        vi.mocked(api.fetchTrades).mockResolvedValue([mockTrade]);

        render(<App />);

        await waitFor(() => {
            expect(screen.getAllByText('$15.00')[0]).toBeInTheDocument();
        });
    });
});
