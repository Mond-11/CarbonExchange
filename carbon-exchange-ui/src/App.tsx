// src/App.tsx
import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { fetchOrderBook, fetchTrades } from './services/api';
import type { OrderBookSnapshot, Trade } from './types';
import TradingForm from './components/TradingForm';
import AutoTrader from './components/AutoTrader';
import './App.css';

function App() {
  const [orderBook, setOrderBook] = useState<OrderBookSnapshot>({ buyOrders: [], sellOrders: [] });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. Initial HTTP Load (so the screen isn't blank on boot)
    fetchOrderBook().then(setOrderBook).catch(() => setError("Backend Offline"));
    fetchTrades().then(setTrades);

    // 2. Establish the WebSocket Connection
    const stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws-exchange', // The endpoint we registered in Java
      reconnectDelay: 5000, // Auto-reconnect if server drops
      onConnect: () => {
        setIsConnected(true);
        setError(null);

        // Listen for Live Trades
        stompClient.subscribe('/topic/trades', (message: { body: string; }) => {
          const newTrade: Trade = JSON.parse(message.body);
          // Use functional state to guarantee we don't drop concurrent trades
          setTrades((prevTrades) => [newTrade, ...prevTrades].slice(0, 15));
        });

        // Listen for Live Order Book updates
        stompClient.subscribe('/topic/orderbook', (message: { body: string; }) => {
          const snapshot: OrderBookSnapshot = JSON.parse(message.body);
          setOrderBook(snapshot);
        });
      },
      onDisconnect: () => setIsConnected(false),
      onWebSocketError: () => setError("Lost connection to live data stream.")
    });

    stompClient.activate();

    // Cleanup connection when component unmounts
    return () => {
      stompClient.deactivate();
    };
  }, []);

  return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Carbon Credit Exchange</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Visual indicator of the WebSocket connection */}
            <span style={{
              height: '10px', width: '10px', borderRadius: '50%',
              backgroundColor: isConnected ? '#4caf50' : '#ff5252'
            }}></span>
            <span style={{ color: '#888', fontSize: '0.9rem' }}>
                {isConnected ? 'LIVE STREAM' : 'DISCONNECTED'}
            </span>
          </div>
          {error && <div className="error-banner">{error}</div>}
        </header>

        <div className="market-layout">

          {/* Left Column: Controls (Stacked) */}
          <div className="controls-column">
            <TradingForm />
            <AutoTrader />
          </div>

          {/* Middle Column: The Order Book */}
          <section className="panel">
            <h2>Live Order Book</h2>
            <div className="order-book">
              <div className="sells">
                <h3>Asks (E-Bikes Selling)</h3>
                <table>
                  <thead><tr><th>Price</th><th>Amount</th></tr></thead>
                  <tbody>
                  {orderBook.sellOrders.map((order, i) => (
                      <tr key={i} className="sell-row">
                        {/* Safely cast to Number before formatting */}
                        <td>${Number(order.price).toFixed(2)}</td>
                        <td>{Number(order.amount).toFixed(2)}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
              <div className="buys">
                <h3>Bids (Gas Vans Buying)</h3>
                <table>
                  <thead><tr><th>Price</th><th>Amount</th></tr></thead>
                  <tbody>
                  {orderBook.buyOrders.map((order, i) => (
                      <tr key={i} className="buy-row">
                        {/* Safely cast to Number before formatting */}
                        <td>${Number(order.price).toFixed(2)}</td>
                        <td>{Number(order.amount).toFixed(2)}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Right Column: Trade History */}
          <section className="panel">
            <h2>Recent Trades</h2>
            <div className="trade-history">
              <table>
                <thead>
                <tr>
                  <th>Time</th>
                  <th>Price</th>
                  <th>Amount</th>
                </tr>
                </thead>
                <tbody>
                {trades.slice(0, 15).map((trade) => ( // Show only last 15
                    <tr key={trade.id}>
                      <td>{new Date(trade.executedAt).toLocaleTimeString()}</td>
                      {/* Safely cast to Number before formatting */}
                      <td className="trade-price">${Number(trade.price).toFixed(2)}</td>
                      <td>{Number(trade.amount).toFixed(2)}</td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
  );
}

export default App;