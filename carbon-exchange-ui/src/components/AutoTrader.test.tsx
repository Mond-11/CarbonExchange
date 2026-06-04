import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AutoTrader from './AutoTrader';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
    placeOrder: vi.fn(),
}));

describe('AutoTrader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    it('should render bot controls', () => {
        render(<AutoTrader />);
        expect(screen.getByText('Market Maker Bot')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'START BOT' })).toBeInTheDocument();
    });

    it('should start and stop the bot', async () => {
        vi.mocked(api.placeOrder).mockResolvedValue(undefined);
        render(<AutoTrader />);

        const startBtn = screen.getByRole('button', { name: 'START BOT' });
        fireEvent.click(startBtn);
        expect(screen.getByRole('button', { name: 'STOP BOT' })).toBeInTheDocument();

        // Advance timers to trigger interval (speed is 2, so every 500ms)
        vi.advanceTimersByTime(500);
        
        expect(api.placeOrder).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'STOP BOT' }));
        expect(screen.getByRole('button', { name: 'START BOT' })).toBeInTheDocument();
        
        vi.advanceTimersByTime(1000);
        expect(api.placeOrder).toHaveBeenCalledTimes(1);
    });
});
