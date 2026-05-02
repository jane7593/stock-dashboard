"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { AlphaVantageQuote } from "@/lib/alphavantage";

const INDICES = [
  { symbol: "^GSPC", name: "S&P 500", region: "🇺🇸 미국" },
  { symbol: "^IXIC", name: "NASDAQ", region: "🇺🇸 미국" },
  { symbol: "^DJI", name: "다우존스", region: "🇺🇸 미국" },
  { symbol: "^N225", name: "니케이 225", region: "🇯🇵 일본" },
  { symbol: "^HSI", name: "항셍", region: "🇭🇰 홍콩" },
  { symbol: "^FTSE", name: "FTSE 100", region: "🇬🇧 영국" },
  { symbol: "^GDAXI", name: "DAX", region: "🇩🇪 독일" },
  { symbol: "000001.SS", name: "상하이종합", region: "🇨🇳 중국" },
];

type IndexQuote = AlphaVantageQuote & { region: string };

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
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchIndices = useCallback(async () => {
    try {
      const results = await Promise.all(
        INDICES.map(async (idx) => {
          const res = await fetch(`/api/yahoo?type=quote&symbol=${idx.symbol}`);
          const json = await res.json();
          if (json.data) {
            return {
              ...json.data,
              region: idx.region,
              name: idx.name,
            };
          }
          return null;
        })
      );

      setIndices(results.filter((r): r is IndexQuote => r !== null));
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

  const selectedIndex = indices.find((i) => i.symbol === selectedSymbol);
  const isPositive = (selectedIndex?.changePercent ?? 0) >= 0;
  const chartColor = isPositive ? "#ef4444" : "#3b82f6";

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🌐 글로벌 주요 지수
            </h1>
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

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-gray-200 animate-pulse"
              />
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
                  ${
                    idx.symbol === selectedSymbol
                      ? "border-indigo-500 shadow-lg bg-indigo-50"
                      : "border-gray-200 bg-white"
                  }
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-400">{idx.region}</p>
                    <p className="font-bold text-gray-800 text-sm">
                      {idx.name}
                    </p>
                  </div>
                </div>

                <p className="text-2xl font-bold text-gray-900">
                  {idx.price.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>

                <div
                  className={`flex gap-2 mt-1 text-sm font-medium ${
                    idx.change >= 0 ? "text-red-500" : "text-blue-500"
                  }`}
                >
                  <span>
                    {idx.change >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(idx.change).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span
                    className={`px-1.5 rounded ${
                      idx.change >= 0 ? "bg-red-50" : "bg-blue-50"
                    }`}
                  >
                    {idx.change >= 0 ? "+" : ""}
                    {idx.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {selectedIndex?.name ?? "..."} 정보
              </h2>
              <p className="text-sm text-gray-400">{selectedIndex?.region}</p>
            </div>
          </div>

          {selectedIndex ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-600">현재가:</span>{" "}
                <span className="font-bold">
                  {selectedIndex.price.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </p>
              <p>
                <span className="text-gray-600">변동:</span>{" "}
                <span
                  className={`font-bold ${
                    selectedIndex.change >= 0 ? "text-red-500" : "text-blue-500"
                  }`}
                >
                  {selectedIndex.change >= 0 ? "+" : ""}
                  {selectedIndex.change.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                  ({selectedIndex.changePercent.toFixed(2)}%)
                </span>
              </p>
              <p>
                <span className="text-gray-600">마지막 업데이트:</span>{" "}
                <span className="font-bold">{selectedIndex.timestamp}</span>
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              지수를 선택해주세요
            </div>
          )}
        </div>
      </div>
    </main>
  );
}