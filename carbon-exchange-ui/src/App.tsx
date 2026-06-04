import { useEffect, useState, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { fetchOrderBook, fetchTrades } from './services/api';
import { getCurrentUser, logout, fetchUser } from './services/auth';
import type { OrderBookSnapshot, Trade, User } from './types';
import TradingForm from './components/TradingForm';
import AutoTrader from './components/AutoTrader';
import MarketMetrics from './components/MarketMetrics';
import PriceChart from './components/PriceChart';
import Auth from './components/Auth';
import './App.css';

const SYSTEM_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Main application component for the Carbon Credit Exchange dashboard.
 * Handles WebSocket connections and manages the state for the order book and trade history.
 */
function App() {
  const [orderBook, setOrderBook] = useState<OrderBookSnapshot>({ buyOrders: [], sellOrders: [] });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const userRef = useRef<User | null>(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const refreshUser = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    try {
      const updatedUser = await fetchUser(currentUser.id);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, []);

  useEffect(() => {
    fetchOrderBook().then(setOrderBook).catch(() => setError("Backend Offline"));
    fetchTrades().then(setTrades);

    const stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws-exchange',
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        setError(null);

        stompClient.subscribe('/topic/trades', (message: { body: string; }) => {
          const newTrade: Trade = JSON.parse(message.body);
          setTrades((prevTrades) => [newTrade, ...prevTrades].slice(0, 100));
          
          // Refresh user balance if they were involved in the trade
          const currentUser = userRef.current;
          if (currentUser && (newTrade.buyerId === currentUser.id || newTrade.sellerId === currentUser.id)) {
             refreshUser();
          }
        });

        stompClient.subscribe('/topic/orderbook', (message: { body: string; }) => {
          const snapshot: OrderBookSnapshot = JSON.parse(message.body);
          setOrderBook(snapshot);
        });
      },
      onDisconnect: () => setIsConnected(false),
      onWebSocketError: () => setError("Lost connection to live data stream.")
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Carbon Credit Exchange</h1>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {user && (
              <div className="user-profile">
                <span>Welcome, <strong>{user.username}</strong></span>
                <div className="balance-group">
                  <span className="balance-money">${user.moneyBalance.toFixed(2)}</span>
                  <span className="balance-credits">{user.creditBalance.toFixed(1)} Credits</span>
                </div>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{
                height: '10px', width: '10px', borderRadius: '50%',
                backgroundColor: isConnected ? '#4caf50' : '#ff5252'
              }}></span>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>
                  {isConnected ? 'LIVE STREAM' : 'DISCONNECTED'}
              </span>
            </div>
          </div>
          {error && <div className="error-banner">{error}</div>}
        </header>

        <MarketMetrics trades={trades} orderBook={orderBook} />

        <div className="market-layout">

          <div className="controls-column">
            {user ? (
                  <TradingForm user={user} />
            ) : (
                <Auth onLogin={setUser} />
            )}
            <AutoTrader />
          </div>

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
                        <td>{order.executionMode === 'MARKET' ? 'MARKET' : `$${Number(order.price).toFixed(2)}`}</td>
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
                        <td>{order.executionMode === 'MARKET' ? 'MARKET' : `$${Number(order.price).toFixed(2)}`}</td>
                        <td>{Number(order.amount).toFixed(2)}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Market Activity</h2>
            <PriceChart trades={trades} />
            <div className="trade-history">
              <h3>Recent Trades</h3>
              <table>
                <thead>
                <tr>
                  <th>Time</th>
                  <th>Price</th>
                  <th>Amount</th>
                </tr>
                </thead>
                <tbody>
                {trades.slice(0, 15).map((trade) => (
                    <tr key={trade.id}>
                      <td>
                        { (trade.buyerId === SYSTEM_ID || trade.sellerId === SYSTEM_ID) && (
                            <span className="system-tag">STABILIZER</span>
                        )}
                        {new Date(trade.executedAt).toLocaleTimeString()}
                      </td>
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