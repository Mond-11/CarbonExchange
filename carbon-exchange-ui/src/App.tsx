import { useEffect, useState, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { Container, Row, Col, Navbar, Nav, Button, Table, Card, Badge, Spinner } from 'react-bootstrap';
import { fetchOrderBook, fetchTrades, emergencyResolveAll } from './services/api';
import { getCurrentUser, logout, fetchUser } from './services/auth';
import type { OrderBookSnapshot, Trade, User } from './types';
import TradingForm from './components/TradingForm';
import AutoTrader from './components/AutoTrader';
import MarketMetrics from './components/MarketMetrics';
import PriceChart from './components/PriceChart';
import Auth from './components/Auth';
import 'bootstrap-icons/font/bootstrap-icons.css';
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
  const [askSort, setAskSort] = useState<{ key: 'price' | 'time', dir: 'asc' | 'desc' }>({ key: 'price', dir: 'asc' });
  const [bidSort, setBidSort] = useState<{ key: 'price' | 'time', dir: 'asc' | 'desc' }>({ key: 'price', dir: 'desc' });
  const userRef = useRef<User | null>(user);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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
          setTrades((prevTrades) => [newTrade, ...prevTrades]);
          
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleEmergencyResolve = async () => {
    if (window.confirm("Are you sure you want to resolve ALL ongoing orders? This is an emergency development feature.")) {
      try {
        await emergencyResolveAll();
      } catch (err) {
        console.error("Emergency resolve failed:", err);
        setError("Failed to trigger emergency resolve.");
      }
    }
  };

  const sortOrders = (orders: OrderRequest[], sort: { key: 'price' | 'time', dir: 'asc' | 'desc' }, isBuy: boolean) => {
    return [...orders].sort((a, b) => {
      // Market orders always have top priority regardless of sort
      if (a.executionMode === 'MARKET' && b.executionMode === 'MARKET') return 0;
      if (a.executionMode === 'MARKET') return -1;
      if (b.executionMode === 'MARKET') return 1;

      let result = 0;
      if (sort.key === 'price') {
        result = (a.price || 0) - (b.price || 0);
      } else {
        result = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return sort.dir === 'asc' ? result : -result;
    });
  };

  const toggleSort = (side: 'buy' | 'sell', key: 'price' | 'time') => {
    const setter = side === 'buy' ? setBidSort : setAskSort;
    setter(prev => ({
      key,
      dir: prev.key === key ? (prev.dir === 'asc' ? 'desc' : 'asc') : (key === 'price' ? (side === 'buy' ? 'desc' : 'asc') : 'asc')
    }));
  };

  const sortedAsks = sortOrders(orderBook.sellOrders, askSort, false);
  const sortedBids = sortOrders(orderBook.buyOrders, bidSort, true);

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar bg={theme === 'dark' ? 'dark' : 'white'} variant={theme} expand="lg" className="border-bottom border-secondary py-3">
        <Container fluid="lg">
          <Navbar.Brand href="#home" className="fw-bold fs-4 d-flex align-items-center gap-2">
            <span style={{ color: '#4caf50' }}>●</span> Carbon Exchange
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav className="align-items-center gap-3">
              <Button 
                variant={theme === 'dark' ? 'outline-light' : 'outline-dark'} 
                size="sm" 
                onClick={toggleTheme} 
                className="rounded-circle p-1 leading-none d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px' }}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <i className={`bi bi-${theme === 'dark' ? 'sun' : 'moon-stars'}-fill`}></i>
              </Button>
              {user && (
                <div className="d-flex align-items-center gap-3 bg-secondary bg-opacity-10 px-3 py-1 rounded-pill">
                  <span className="text-secondary small">Welcome, <strong>{user.username}</strong></span>
                  <div className="d-flex gap-3 small fw-bold">
                    <span className="text-success">${user.moneyBalance.toFixed(2)}</span>
                    <span className="text-info">{user.creditBalance.toFixed(1)} Credits</span>
                  </div>
                  <Button 
                    variant={theme === 'dark' ? 'outline-light' : 'outline-dark'} 
                    size="sm" 
                    onClick={handleLogout} 
                    className="rounded-pill px-3 py-0 border-secondary text-secondary"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid="lg" className="py-4 flex-grow-1">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
            <strong>Error!</strong> {error}
          </div>
        )}

        <MarketMetrics trades={trades} orderBook={orderBook} />

        <Row className="g-4">
          <Col lg={4} xl={3} className="d-flex flex-column gap-4">
            <Card className="panel-card shadow-sm border-0">
              <Card.Body>
                {user ? (
                  <TradingForm user={user} />
                ) : (
                  <Auth onLogin={setUser} />
                )}
              </Card.Body>
            </Card>
            <Card className="panel-card shadow-sm border-0" style={{ borderLeft: '4px solid #ab47bc' }}>
              <Card.Body>
                <AutoTrader orderBook={orderBook} />
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8} xl={9}>
            <Row className="g-4">
              <Col md={12}>
                <Card className="panel-card shadow-sm border-0 mb-4">
                  <Card.Header className="bg-transparent border-0 pt-3 pb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-bold text-body">Live Order Book</h5>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={handleEmergencyResolve}
                        className="px-3 py-1 fw-bold small text-uppercase"
                        style={{ fontSize: '0.7rem' }}
                      >
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        Emergency Resolve All
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <h6 className="text-danger small fw-bold text-uppercase mb-3">Asks (Selling)</h6>
                        <div className="scrollable-list">
                          <Table variant={theme === 'dark' ? 'dark' : 'light'} hover size="sm" className="bg-transparent mb-0">
                            <thead className="text-secondary small">
                              <tr>
                                <th onClick={() => toggleSort('sell', 'price')} style={{ cursor: 'pointer' }}>
                                  Price {askSort.key === 'price' && <i className={`bi bi-sort-numeric-${askSort.dir === 'asc' ? 'down' : 'up'}`}></i>}
                                </th>
                                <th>Amount</th>
                                <th onClick={() => toggleSort('sell', 'time')} style={{ cursor: 'pointer' }}>
                                  Time {askSort.key === 'time' && <i className={`bi bi-sort-numeric-${askSort.dir === 'asc' ? 'down' : 'up'}`}></i>}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedAsks.map((order, i) => (
                                <tr key={i} className="sell-row border-0">
                                  <td>{order.executionMode === 'MARKET' ? 'MARKET' : `$${Number(order.price).toFixed(2)}`}</td>
                                  <td>{Number(order.amount).toFixed(2)}</td>
                                  <td className="text-secondary x-small">{new Date(order.timestamp).toLocaleTimeString()}</td>
                                </tr>
                              ))}
                              {sortedAsks.length === 0 && (
                                <tr><td colSpan={3} className="text-center text-secondary py-3 italic">Empty</td></tr>
                              )}
                            </tbody>
                          </Table>
                        </div>
                      </Col>
                      <Col md={6} className="border-start border-secondary">
                        <h6 className="text-success small fw-bold text-uppercase mb-3">Bids (Buying)</h6>
                        <div className="scrollable-list">
                          <Table variant={theme === 'dark' ? 'dark' : 'light'} hover size="sm" className="bg-transparent mb-0">
                            <thead className="text-secondary small">
                              <tr>
                                <th onClick={() => toggleSort('buy', 'price')} style={{ cursor: 'pointer' }}>
                                  Price {bidSort.key === 'price' && <i className={`bi bi-sort-numeric-${bidSort.dir === 'asc' ? 'down' : 'up'}`}></i>}
                                </th>
                                <th>Amount</th>
                                <th onClick={() => toggleSort('buy', 'time')} style={{ cursor: 'pointer' }}>
                                  Time {bidSort.key === 'time' && <i className={`bi bi-sort-numeric-${bidSort.dir === 'asc' ? 'down' : 'up'}`}></i>}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedBids.map((order, i) => (
                                <tr key={i} className="buy-row border-0">
                                  <td>{order.executionMode === 'MARKET' ? 'MARKET' : `$${Number(order.price).toFixed(2)}`}</td>
                                  <td>{Number(order.amount).toFixed(2)}</td>
                                  <td className="text-secondary x-small">{new Date(order.timestamp).toLocaleTimeString()}</td>
                                </tr>
                              ))}
                              {sortedBids.length === 0 && (
                                <tr><td colSpan={3} className="text-center text-secondary py-3 italic">Empty</td></tr>
                              )}
                            </tbody>
                          </Table>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={12}>
                <Card className="panel-card shadow-sm border-0">
                  <Card.Header className="bg-transparent border-0 pt-3 pb-0">
                    <h5 className="mb-0 fw-bold text-body">Market Activity</h5>
                  </Card.Header>
                  <Card.Body>
                    <PriceChart trades={trades} theme={theme} />
                    <div className="mt-4">
                      <h6 className="text-secondary small fw-bold text-uppercase mb-3">Recent Trades</h6>
                      <div className="scrollable-list" style={{ maxHeight: '250px' }}>
                        <Table variant={theme === 'dark' ? 'dark' : 'light'} hover size="sm" className="bg-transparent mb-0">
                          <thead className="text-secondary small">
                            <tr><th>Time</th><th>Price</th><th>Amount</th></tr>
                          </thead>
                          <tbody>
                            {trades.map((trade) => (
                              <tr key={trade.id}>
                                <td>
                                  { (trade.buyerId === SYSTEM_ID || trade.sellerId === SYSTEM_ID) && (
                                    <Badge bg="secondary" className="me-2 text-uppercase" style={{ fontSize: '0.6rem' }}>STABILIZER</Badge>
                                  )}
                                  <span className="small text-secondary">{new Date(trade.executedAt).toLocaleTimeString()}</span>
                                </td>
                                <td className="trade-price">${Number(trade.price).toFixed(2)}</td>
                                <td>{Number(trade.amount).toFixed(2)}</td>
                              </tr>
                            ))}
                            {trades.length === 0 && (
                                <tr><td colSpan={3} className="text-center text-secondary py-3">Waiting for trades...</td></tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;