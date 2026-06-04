// src/types/index.ts

export type OrderType = 'BUY' | 'SELL';

export interface OrderRequest {
    courierId: string;
    type: OrderType;
    amount: number;
    price: number;
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