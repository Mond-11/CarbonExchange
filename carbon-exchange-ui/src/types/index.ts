// src/types/index.ts

export type OrderType = 'BUY' | 'SELL';
export type ExecutionMode = 'LIMIT' | 'MARKET';

export interface OrderRequest {
    courierId: string;
    type: OrderType;
    executionMode: ExecutionMode;
    amount: number;
    price: number | null;
    timestamp: string;
}

export interface OrderBookSnapshot {
    buyOrders: OrderRequest[];
    sellOrders: OrderRequest[];
}

export interface Trade {
    id: string;
    buyerId: string;
    sellerId: string;
    price: number;
    amount: number;
    executedAt: string;
}

export interface User {
    id: string;
    username: string;
    moneyBalance: number;
    creditBalance: number;
}