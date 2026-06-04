import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOrderBook, fetchTrades, placeOrder } from './api';

describe('api service', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('fetchOrderBook should return data on success', async () => {
        const mockData = { buyOrders: [], sellOrders: [] };
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockData,
        });

        const result = await fetchOrderBook();
        expect(result).toEqual(mockData);
        expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/v1/exchange/orderbook');
    });

    it('fetchOrderBook should throw error on failure', async () => {
        (fetch as any).mockResolvedValue({
            ok: false,
        });

        await expect(fetchOrderBook()).rejects.toThrow('Failed to fetch order book');
    });

    it('fetchTrades should return data on success', async () => {
        const mockData = [{ id: '1', buyerId: 'b', sellerId: 's', price: 10, amount: 5, executedAt: 'now' }];
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockData,
        });

        const result = await fetchTrades();
        expect(result).toEqual(mockData);
    });

    it('placeOrder should send post request', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
        });

        const order = { courierId: '1', type: 'BUY' as const, price: 10, amount: 5, timestamp: 'now' };
        await placeOrder(order);

        expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/v1/exchange/order', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(order),
        }));
    });
});
