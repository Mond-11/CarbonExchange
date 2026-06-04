import React, { useMemo, useState } from 'react';
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
        <div className="metrics-banner">
            <div className="metric-item">
                <span className="metric-label">LTP</span>
                <span className="metric-value">${ltp.toFixed(2)}</span>
            </div>
            <div className="metric-item">
                <span className="metric-label">SPREAD</span>
                <span className="metric-value">
                    {spread !== null ? `$${spread.toFixed(2)}` : 'N/A'}
                </span>
            </div>
            <div className="metric-item">
                <div className="metric-label-group">
                    <span className="metric-label">VOLUME</span>
                    <select 
                        value={volSelection} 
                        onChange={(e) => setVolSelection(e.target.value as TimeSelection)}
                        className="vol-selector"
                    >
                        <option value="1M">1 MIN</option>
                        <option value="1H">1 HR</option>
                        <option value="1D">1 DAY</option>
                    </select>
                </div>
                <span className="metric-value">{volumeValue.toFixed(1)}</span>
            </div>
        </div>
    );
};

export default MarketMetrics;
