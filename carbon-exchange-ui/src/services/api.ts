// src/services/api.ts
import type { OrderBookSnapshot, Trade } from '../types';

const API_BASE_URL = 'http://localhost:8080/api/v1/exchange';

export const fetchOrderBook = async (): Promise<OrderBookSnapshot> => {
    const response = await fetch(`${API_BASE_URL}/orderbook`);
    if (!response.ok) throw new Error('Failed to fetch order book');
    return response.json();
};

export const fetchTrades = async (): Promise<Trade[]> => {
    const response = await fetch(`${API_BASE_URL}/trades`);
    if (!response.ok) throw new Error('Failed to fetch trades');
    return response.json();
};