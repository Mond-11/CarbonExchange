// src/types/index.ts

export type OrderType = 'BUY' | 'SELL' | 'CLEAR_ALL';
export type ExecutionMode = 'LIMIT' | 'MARKET';

/**
 * Represents a request to place an order.
 */
export interface OrderRequest {
    courierId: string;
    type: OrderType;
    executionMode: ExecutionMode;
    amount: number;
    price: number | null;
    timestamp: string;
}

/**
 * A snapshot of the current state of the order book.
 */
export interface OrderBookSnapshot {
    buyOrders: OrderRequest[];
    sellOrders: OrderRequest[];
}

/**
 * Represents an executed trade.
 */
export interface Trade {
    id: string;
    buyerId: string;
    sellerId: string;
    price: number;
    amount: number;
    executedAt: string;
}

/**
 * Represents a user in the system.
 */
export interface User {
    id: string;
    username: string;
    moneyBalance: number;
    creditBalance: number;
}