"use client";

import { useEffect, useState, useCallback } from "react";
import { IndexQuote } from "@/lib/yahoo";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("^GSPC");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [chartData, setChartData] = useState<{ date: string; close: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const fetchChart = useCallback(async (symbol: string) => {
    setChartLoading(true);
    try {
      const year = new Date().getFullYear();
      const start = Math.floor(new Date(`${year}-01-01`).getTime() / 1000);
      const end = Math.floor(Date.now() / 1000);
      const encoded = encodeURIComponent(symbol);
      const res = await fetch(`/api/chart?symbol=${encoded}&start=${start}&end=${end}`);
      const json = await res.json();
      setChartData(json.data ?? []);
    } catch (e) {
      console.error("Failed to fetch chart", e);
    } finally {
      setChartLoading(false);
    }
  }, []);

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

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 30_000);
    return () => clearInterval(interval);
  }, [fetchIndices]);

  useEffect(() => {
    fetchChart(selectedSymbol);
  }, [selectedSymbol, fetchChart]);

  const selectedIndex = indices.find((i) => i.symbol === selectedSymbol);
  const isPositive = (selectedIndex?.ytdReturn ?? 0) >= 0;
  const chartColor = isPositive ? "#ef4444" : "#3b82f6";

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              📊 특별계정사업부 변액주식운용 대시보드 📊 (제인 개발 중~)
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-1">
              🌐 글로벌 주요 지수
            </h2>
            <p className="text-sm text-gray-400">
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
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {indices.map((idx) => (
              <div
                key={idx.symbol}
                onClick={() => setSelectedSymbol(idx.symbol)}
                className={`
                  rounded-xl border-2 p-4 cursor-pointer transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5
                  ${idx.symbol === selectedSymbol
                    ? "border-indigo-500 shadow-lg bg-indigo-50"
                    : "border-gray-200 bg-white"
                  }
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-400">{idx.region}</p>
                    <p className="font-bold text-gray-800 text-sm">{idx.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    idx.marketState === "REGULAR"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {idx.marketState === "REGULAR" ? "장중" : "장마감"}
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {idx.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </p>
                <div className={`flex gap-2 mt-1 text-sm font-medium ${
                  idx.change >= 0 ? "text-red-500" : "text-blue-500"
                }`}>
                  <span>
                    {idx.change >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(idx.change).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </span>
                  <span className={`px-1.5 rounded ${
                    idx.change >= 0 ? "bg-red-50" : "bg-blue-50"
                  }`}>
                    {idx.change >= 0 ? "+" : ""}
                    {idx.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">YTD </span>
                  <span className={`text-xs font-bold ${
                    idx.ytdReturn >= 0 ? "text-red-500" : "text-blue-500"
                  }`}>
                    {idx.ytdReturn >= 0 ? "+" : ""}
                    {idx.ytdReturn.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* YTD 차트 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {selectedIndex?.name ?? "..."} YTD 차트
              </h2>
              <p className="text-sm text-gray-400">{selectedIndex?.region}</p>
            </div>
            {selectedIndex && (
              <span className={`text-lg font-bold ${
                selectedIndex.ytdReturn >= 0 ? "text-red-500" : "text-blue-500"
              }`}>
                YTD {selectedIndex.ytdReturn >= 0 ? "+" : ""}
                {selectedIndex.ytdReturn.toFixed(2)}%
              </span>
            )}
          </div>

          {chartLoading ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              차트 불러오는 중...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => v.toLocaleString()}
                  width={70}
                />
                <Tooltip
                  labelFormatter={(label: any) => `날짜: ${label}`}
                  formatter={(value: any) => [
                    typeof value === "number"
                      ? value.toLocaleString("en-US", { maximumFractionDigits: 2 })
                      : value,
                    "종가",
                  ]}
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
              차트 데이터 없음
            </div>
          )}
        </div>

        {/* 상세정보 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {selectedIndex?.name ?? "..."} 상세정보
          </h2>
          {selectedIndex ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">현재가</p>
                <p className="text-xl font-bold">
                  {selectedIndex.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">전일대비</p>
                <p className={`text-xl font-bold ${
                  selectedIndex.change >= 0 ? "text-red-500" : "text-blue-500"
                }`}>
                  {selectedIndex.change >= 0 ? "+" : ""}
                  {selectedIndex.change.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">등락률</p>
                <p className={`text-xl font-bold ${
                  selectedIndex.change >= 0 ? "text-red-500" : "text-blue-500"
                }`}>
                  {selectedIndex.change >= 0 ? "+" : ""}
                  {selectedIndex.changePercent.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">YTD 수익률</p>
                <p className={`text-xl font-bold ${
                  selectedIndex.ytdReturn >= 0 ? "text-red-500" : "text-blue-500"
                }`}>
                  {selectedIndex.ytdReturn >= 0 ? "+" : ""}
                  {selectedIndex.ytdReturn.toFixed(2)}%
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">지수를 선택해주세요</p>
          )}
        </div>

      </div>
    </main>
  );
}