import React, { useMemo, useState } from 'react';
import { Row, Col, Card, Form } from 'react-bootstrap';
import type { Trade, OrderBookSnapshot } from '../types';

interface MarketMetricsProps {
    trades: Trade[];
    orderBook: OrderBookSnapshot;
}

type TimeSelection = '1M' | '1H' | '1D';

const MarketMetrics: React.FC<MarketMetricsProps> = ({ trades, orderBook }) => {
    const [volSelection, setVolSelection] = useState<TimeSelection>('1M');
    const ltp = trades[0]?.price || 0;

    const spread = useMemo(() => {
        const bestBid = orderBook.buyOrders[0]?.price;
        const bestAsk = orderBook.sellOrders[0]?.price;
        if (bestBid !== undefined && bestAsk !== undefined && bestBid !== null && bestAsk !== null) {
            return bestAsk - bestBid;
        }
        return null;
    }, [orderBook]);

    const calculateVolume = (minutes: number) => {
        const now = new Date().getTime();
        const cutoff = now - minutes * 60 * 1000;
        return trades
            .filter(t => new Date(t.executedAt).getTime() > cutoff)
            .reduce((sum, t) => sum + Number(t.amount), 0);
    };

    const volumeValue = useMemo(() => {
        switch (volSelection) {
            case '1M': return calculateVolume(1);
            case '1H': return calculateVolume(60);
            case '1D': return calculateVolume(1440);
            default: return 0;
        }
    }, [trades, volSelection]);

    return (
        <Row className="mb-4 g-3">
            <Col sm={4}>
                <Card className="metric-card shadow-sm border-0 text-center py-2 h-100">
                    <Card.Body className="p-2">
                        <div className="text-secondary small fw-bold text-uppercase mb-1" style={{ letterSpacing: '1px' }}>Last Traded Price</div>
                        <h4 className="text-success mb-0 fw-bold">${ltp.toFixed(2)}</h4>
                    </Card.Body>
                </Card>
            </Col>
            <Col sm={4}>
                <Card className="metric-card shadow-sm border-0 text-center py-2 h-100">
                    <Card.Body className="p-2">
                        <div className="text-secondary small fw-bold text-uppercase mb-1" style={{ letterSpacing: '1px' }}>Market Spread</div>
                        <h4 className="text-primary mb-0 fw-bold">
                            {spread !== null ? `$${spread.toFixed(2)}` : 'N/A'}
                        </h4>
                    </Card.Body>
                </Card>
            </Col>
            <Col sm={4}>
                <Card className="metric-card shadow-sm border-0 text-center py-2 h-100">
                    <Card.Body className="p-2">
                        <div className="d-flex justify-content-center align-items-center gap-2 mb-1">
                            <div className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>Volume</div>
                            <Form.Select 
                                size="sm" 
                                className="bg-transparent border-0 text-secondary fw-bold p-0 w-auto" 
                                style={{ fontSize: '0.7rem' }}
                                value={volSelection}
                                onChange={(e) => setVolSelection(e.target.value as TimeSelection)}
                            >
                                <option value="1M">1M</option>
                                <option value="1H">1H</option>
                                <option value="1D">1D</option>
                            </Form.Select>
                        </div>
                        <h4 className="text-info mb-0 fw-bold">{volumeValue.toFixed(1)} <small className="fs-6">Credits</small></h4>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default MarketMetrics;
