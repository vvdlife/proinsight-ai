import React, { useEffect, useState } from 'react';
import { RefreshIcon, ChartIcon } from './Icons';

interface MarketItem {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
}

interface MarketDataResponse {
    timestamp: string;
    data: MarketItem[];
    status: string;
}

export const MarketWidget: React.FC = () => {
    const [marketData, setMarketData] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [error, setError] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/market_data');
            if (!res.ok) throw new Error('Failed to fetch');
            const json: MarketDataResponse = await res.json();

            if (json.status === 'success') {
                setMarketData(json.data);
                const date = new Date(json.timestamp);
                setLastUpdated(date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
                setError(false);
            }
        } catch (e) {
            console.error("Market data fetch error:", e);
            setError(true);
            // Fallback mock data for dev/error
            setMarketData([
                { symbol: 'GC=F', name: 'Gold', price: 2650.50, change: 12.5, changePercent: 0.47, currency: 'USD' },
                { symbol: '^KS11', name: 'KOSPI', price: 2750.20, change: -10.5, changePercent: -0.38, currency: 'KRW' },
                { symbol: 'KRW=X', name: 'USD/KRW', price: 1380.50, change: 5.0, changePercent: 0.36, currency: 'KRW' },
                { symbol: 'NVDA', name: 'NVIDIA', price: 140.20, change: -2.3, changePercent: -1.6, currency: 'USD' },
                { symbol: 'HG=F', name: 'Copper', price: 4.15, change: 0.05, changePercent: 1.2, currency: 'USD' },
                { symbol: '005930.KS', name: 'Samsung Elec', price: 56000, change: -500, changePercent: -0.89, currency: 'KRW' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Refresh every 5 minutes safely (matching cache)
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <ChartIcon className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">실시간 시장 현황</h3>
                    {lastUpdated && <span className="text-xs text-slate-400">({lastUpdated} 기준)</span>}
                </div>
                <button
                    onClick={fetchData}
                    className={`text-slate-400 hover:text-indigo-600 transition-colors ${loading ? 'animate-spin' : ''}`}
                    title="새로고침"
                >
                    <RefreshIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="p-2 overflow-x-auto custom-scrollbar">
                <div className="flex gap-4 p-2 min-w-max">
                    {marketData.map((item) => (
                        <div key={item.symbol} className="flex flex-col min-w-[140px] px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="text-xs font-bold text-slate-500 mb-1 flex justify-between">
                                {item.name}
                                <span className="text-[10px] bg-slate-100 px-1 rounded">{item.currency}</span>
                            </div>
                            <div className="text-lg font-extrabold text-slate-900">
                                {item.currency === 'KRW'
                                    ? item.price.toLocaleString()
                                    : item.price.toFixed(2)}
                            </div>
                            <div className={`text-xs font-bold flex items-center gap-1 ${item.change >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                <span>{item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}</span>
                                <span>({item.changePercent.toFixed(2)}%)</span>
                            </div>
                            {/* Hover info */}
                            <div className="absolute inset-0 bg-white/90 hidden group-hover:flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs font-bold text-indigo-600 cursor-pointer">상세 보기</span>
                            </div>
                        </div>
                    ))}
                    {error && !loading && (
                        <div className="flex items-center text-xs text-amber-500 px-2">
                            ⚠️ 실시간 데이터 로드 실패 (데모 데이터 표시 중)
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
