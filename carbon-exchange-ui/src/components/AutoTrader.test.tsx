import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AutoTrader from './AutoTrader';
import * as api from '../services/api';
import * as auth from '../services/auth';

vi.mock('../services/api', () => ({
    placeOrder: vi.fn(),
}));

vi.mock('../services/auth', () => ({
    fetchAllUsers: vi.fn(),
}));

const mockUsers = [
    { id: '1', username: 'user1', moneyBalance: 1000, creditBalance: 100 },
    { id: '2', username: 'user2', moneyBalance: 1000, creditBalance: 100 }
];

describe('AutoTrader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth.fetchAllUsers).mockResolvedValue(mockUsers);
    });

    it('should render bot controls', async () => {
        render(<AutoTrader />);
        expect(screen.getByText('Market Maker Bot')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'START SIMULATION' })).toBeInTheDocument();
    });

    it('should start and stop the bot', async () => {
        vi.useFakeTimers();
        vi.mocked(api.placeOrder).mockResolvedValue(undefined);
        render(<AutoTrader />);

        // Wait for users to be fetched (Promises need to resolve even with fake timers)
        await vi.runAllTimersAsync();
        
        const startBtn = screen.getByRole('button', { name: 'START SIMULATION' });
        fireEvent.click(startBtn);
        expect(screen.getByRole('button', { name: 'STOP SIMULATION' })).toBeInTheDocument();

        // Advance timers to trigger interval (speed is 2, so every 500ms)
        await vi.advanceTimersByTimeAsync(501);
        
        expect(api.placeOrder).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'STOP SIMULATION' }));
        expect(screen.getByRole('button', { name: 'START SIMULATION' })).toBeInTheDocument();
        
        await vi.advanceTimersByTimeAsync(1000);
        expect(api.placeOrder).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });
});
