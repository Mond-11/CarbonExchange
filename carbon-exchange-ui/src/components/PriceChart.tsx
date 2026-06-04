import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import type { Trade } from '../types';

interface PriceChartProps {
    trades: Trade[];
    theme: 'light' | 'dark';
}

/**
 * A real-time line chart component that plots execution prices of recent trades.
 * 
 * @param props.trades list of trades to plot
 * @param props.theme current application theme (light/dark) for styling
 */
const PriceChart: React.FC<PriceChartProps> = ({ trades, theme }) => {
    // Reverse trades to show them in chronological order (oldest to newest)
    // and take the last 50 for the chart.
    const chartData = [...trades]
        .reverse()
        .slice(-50)
        .map(t => ({
            time: new Date(t.executedAt).toLocaleTimeString(),
            price: Number(t.price)
        }));

    const isDark = theme === 'dark';

    return (
        <div className="chart-container" style={{ height: '300px', width: '100%', marginBottom: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#e0e0e0"} />
                    <XAxis 
                        dataKey="time" 
                        stroke="#888" 
                        fontSize={12}
                        tick={{ fill: '#888' }}
                    />
                    <YAxis 
                        stroke="#888" 
                        fontSize={12}
                        tick={{ fill: '#888' }}
                        domain={['auto', 'auto']}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: isDark ? '#1e1e1e' : '#fff', 
                            borderColor: isDark ? '#444' : '#ccc', 
                            color: isDark ? '#fff' : '#000' 
                        }}
                        itemStyle={{ color: '#4caf50' }}
                        labelStyle={{ color: '#888' }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#4caf50" 
                        strokeWidth={2}
                        dot={false}
                        animationDuration={300}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PriceChart;
