import React from 'react';
import { ApiUsageStats } from '../types';
import { ChartIcon, TrendIcon, AlertIcon } from './Icons';

interface ApiUsageMonitorProps {
    usage: ApiUsageStats;
    userLimit?: number; // Optional user-set monthly limit
}

export const ApiUsageMonitor: React.FC<ApiUsageMonitorProps> = ({ usage, userLimit }) => {
    // Get current month usage
    const getCurrentMonthUsage = () => {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return usage.monthlyUsage[yearMonth] || { calls: 0, tokens: 0, cost: 0 };
    };

    const currentMonth = getCurrentMonthUsage();
    const usagePercentage = userLimit ? (currentMonth.cost / userLimit) * 100 : 0;

    // Calculate pricing (approximate Google AI Pricing)
    const getPricing = (modelId: string) => {
        const pricing: Record<string, { input: number; output: number }> = {
            'gemini-1.5-pro': { input: 0.00125, output: 0.005 }, // per 1K tokens
            'gemini-2.5-flash': { input: 0.000075, output: 0.0003 },
            'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
        };
        return pricing[modelId] || pricing['gemini-1.5-flash'];
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mt-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <ChartIcon className="w-5 h-5" />
                    API 사용량 모니터링
                </h3>
            </div>

            <div className="p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            총 호출
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-slate-900">{usage.totalCalls.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">전체 기간</div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            총 토큰
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-slate-900">{usage.totalTokens.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">입력 + 출력</div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            예상 비용
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-indigo-600">
                                ${usage.estimatedCost.toFixed(4)}
                            </div>
                            <div className="text-[10px] text-slate-400">USD</div>
                        </div>
                    </div>
                </div>

                {/* Monthly Usage */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="font-bold text-indigo-900">이번 달 사용량</div>
                            <div className="text-xs text-indigo-600 mt-1">
                                {currentMonth.calls} 호출 • {currentMonth.tokens.toLocaleString()} 토큰
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-indigo-600">
                                ${currentMonth.cost.toFixed(4)}
                            </div>
                            {userLimit && (
                                <div className="text-xs text-indigo-500 mt-1">
                                    한도: ${userLimit}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {userLimit && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-indigo-600 font-medium">사용률</span>
                                <span className={`font-bold ${usagePercentage > 80 ? 'text-red-600' : 'text-indigo-600'}`}>
                                    {usagePercentage.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-indigo-100 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${usagePercentage > 80 ? 'bg-red-500' : 'bg-indigo-500'
                                        }`}
                                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                />
                            </div>
                            {usagePercentage > 80 && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-red-600 font-medium">
                                    <AlertIcon className="w-3 h-3" />
                                    경고: 월 한도의 80%를 초과했습니다!
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Recent Calls */}
                <div>
                    <h4 className="font-bold text-slate-800 mb-3 text-sm">최근 API 호출 기록</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {usage.callHistory.slice(0, 10).map((call, idx) => {
                            const pricing = getPricing(call.modelId);
                            const estimatedCost = (call.promptTokens / 1000) * pricing.input +
                                (call.completionTokens / 1000) * pricing.output;

                            return (
                                <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-slate-700">{call.operation}</span>
                                        <span className="text-slate-500">
                                            {new Date(call.timestamp).toLocaleString('ko-KR', {
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-500">
                                        <span>{call.modelId.replace('gemini-', '')}</span>
                                        <span>{call.totalTokens.toLocaleString()} 토큰 • ${estimatedCost.toFixed(5)}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {usage.callHistory.length === 0 && (
                            <div className="text-center text-slate-400 py-8">
                                아직 API 호출 기록이 없습니다
                            </div>
                        )}
                    </div>
                </div>

                {/* Pricing Info */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="text-xs text-slate-500">
                        <div className="font-semibold mb-2">💡 가격 정보 (1K 토큰당, 근사치)</div>
                        <div className="space-y-1">
                            <div>• Gemini 1.5 Pro: 입력 $0.00125, 출력 $0.005</div>
                            <div>• Gemini 2.5 Flash: 입력 $0.000075, 출력 $0.0003</div>
                            <div>• Gemini 1.5 Flash: 입력 $0.000075, 출력 $0.0003</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
