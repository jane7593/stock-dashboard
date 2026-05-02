"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import IndexCard from "@/components/IndexCard";
import { IndexQuote } from "@/lib/yahoo";

const PERIODS = ["1mo", "3mo", "6mo", "1y"] as const;
type Period = typeof PERIODS[number];

const PERIOD_LABEL: Record<Period, string> = {
  "1mo": "1개월",
  "3mo": "3개월",
  "6mo": "6개월",
  "1y": "1년",
};

export default function Dashboard() {
  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("^GSPC");
  const [period, setPeriod] = useState<Period>("1mo");
  const [history, setHistory] = useState<{ date: string; close: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 전체 지수 가져오기
  const fetchIndices = useCallback(async () => {
    try {
      const res = await fetch("/api/yahoo?type=all");
      const json = await res.json();
      setIndices(json.data ?? []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch indices", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 차트 데이터 가져오기
  const fetchHistory = useCallback(async () => {
    if (!selectedSymbol) return;
    try {
      const res = await fetch(`/api/yahoo?type=history&symbol=${selectedSymbol}&period=${period}`);
      const json = await res.json();
      setHistory(json.data ?? []);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  }, [selectedSymbol, period]);

  // 초기 로딩 + 30초 자동 갱신
  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 30_000);
    return () => clearInterval(interval);
  }, [fetchIndices]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const selectedIndex = indices.find((i) => i.symbol === selectedSymbol);
  const isPositive = (selectedIndex?.changePercent ?? 0) >= 0;
  const chartColor = isPositive ? "#ef4444" : "#3b82f6";

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🌐 글로벌 주요 지수</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {lastUpdated
                ? `마지막 업데이트: ${lastUpdated.toLocaleTimeString("ko-KR")}`
                : "불러오는 중..."}
            </p>
          </div>
          <button
            onClick={fetchIndices}
            className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            🔄 새로고침
          </button>
        </div>

        {/* 지수 카드 그리드 */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {indices.map((idx) => (
              <IndexCard
                key={idx.symbol}
                data={idx}
                isSelected={idx.symbol === selectedSymbol}
                onClick={() => setSelectedSymbol(idx.symbol)}
              />
            ))}
          </div>
        )}

        {/* 차트 영역 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {selectedIndex?.name ?? "..."} 차트
              </h2>
              <p className="text-sm text-gray-400">{selectedIndex?.region}</p>
            </div>
            {/* 기간 선택 */}
            <div className="flex gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-sm px-3 py-1.5 rounded-lg transition ${
                    period === p
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {PERIOD_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickFormatter={(v) => v.slice(5)} // MM-DD
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => v.toLocaleString()}
                  width={70}
                />
                <Tooltip
                  formatter={(value: any) => [
                    value.toLocaleString("en-US", { maximumFractionDigits: 2 }),
                    "종가",
                  ]}
                  labelFormatter={(label) => `날짜: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke={chartColor}
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              차트 데이터를 불러오는 중...
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
