// src/App.tsx
import { useEffect, useState } from 'react';
import { fetchOrderBook, fetchTrades } from './services/api';
import type { OrderBookSnapshot, Trade } from './types';
import './App.css';

function App() {
  const [orderBook, setOrderBook] = useState<OrderBookSnapshot>({ buyOrders: [], sellOrders: [] });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadMarketData = async () => {
    try {
      const [obData, tradesData] = await Promise.all([fetchOrderBook(), fetchTrades()]);
      setOrderBook(obData);
      setTrades(tradesData);
      setError(null);
    } catch (err) {
      setError("Cannot connect to Exchange Engine. Is Spring Boot running?");
    }
  };

  useEffect(() => {
    // Initial load
    loadMarketData();

    // Poll the server every 2 seconds for live updates
    const interval = setInterval(loadMarketData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Carbon Credit Exchange</h1>
          {error && <div className="error-banner">{error}</div>}
        </header>

        <div className="market-layout">
          {/* Left Column: The Order Book */}
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
                        <td>${order.price.toFixed(2)}</td>
                        <td>{order.amount.toFixed(2)}</td>
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
                        <td>${order.price.toFixed(2)}</td>
                        <td>{order.amount.toFixed(2)}</td>
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
                      <td className="trade-price">${trade.price.toFixed(2)}</td>
                      <td>{trade.amount.toFixed(2)}</td>
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