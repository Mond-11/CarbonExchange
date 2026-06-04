import type { OrderBookSnapshot, Trade, OrderRequest } from '../types';

const API_BASE_URL = 'http://localhost:8080/api/v1/exchange';

/**
 * Fetches the current state of the order book from the exchange.
 * 
 * @returns a promise that resolves to the order book snapshot
 * @throws Error if the fetch request fails
 */
export const fetchOrderBook = async (): Promise<OrderBookSnapshot> => {
    const response = await fetch(`${API_BASE_URL}/orderbook`);
    if (!response.ok) throw new Error('Failed to fetch order book');
    return response.json();
};

/**
 * Fetches the history of executed trades from the exchange.
 * 
 * @returns a promise that resolves to an array of trades
 * @throws Error if the fetch request fails
 */
export const fetchTrades = async (): Promise<Trade[]> => {
    const response = await fetch(`${API_BASE_URL}/trades`);
    if (!response.ok) throw new Error('Failed to fetch trades');
    return response.json();
};

/**
 * Places a new order on the exchange.
 * 
 * @param order the order request to place
 * @returns a promise that resolves when the order is successfully placed
 * @throws Error if the request fails
 */
export const placeOrder = async (order: OrderRequest): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
    });

    if (!response.ok) {
        throw new Error('Failed to submit order to the exchange');
    }
};