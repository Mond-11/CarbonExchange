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
}

const PriceChart: React.FC<PriceChartProps> = ({ trades }) => {
    // Reverse trades to show them in chronological order (oldest to newest)
    // and take the last 50 for the chart.
    const chartData = [...trades]
        .reverse()
        .slice(-50)
        .map(t => ({
            time: new Date(t.executedAt).toLocaleTimeString(),
            price: Number(t.price)
        }));

    return (
        <div className="chart-container" style={{ height: '300px', width: '100%', marginBottom: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
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
                        contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#444', color: '#fff' }}
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
