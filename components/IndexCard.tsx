"use client";

import { IndexQuote } from "@/lib/yahoo";

interface Props {
  data: IndexQuote;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function IndexCard({ data, onClick, isSelected }: Props) {
  const isPositive = data.change >= 0;
  const changeColor = isPositive ? "text-red-500" : "text-blue-500"; // 한국식: 상승=빨강
  const bgColor = isPositive ? "bg-red-50" : "bg-blue-50";
  const borderColor = isSelected ? "border-indigo-500 shadow-lg" : "border-gray-200";

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border-2 p-4 cursor-pointer transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        ${borderColor} ${isSelected ? "bg-indigo-50" : "bg-white"}
      `}
    >
      {/* 헤더 */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs text-gray-400">{data.region}</p>
          <p className="font-bold text-gray-800 text-sm">{data.name}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            data.marketState === "REGULAR"
              ? "bg-green-100 text-green-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {data.marketState === "REGULAR" ? "장중" : "장마감"}
        </span>
      </div>

      {/* 현재가 */}
      <p className="text-2xl font-bold text-gray-900">
        {data.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </p>

      {/* 등락 */}
      <div className={`flex gap-2 mt-1 text-sm font-medium ${changeColor}`}>
        <span>
          {isPositive ? "▲" : "▼"}{" "}
          {Math.abs(data.change).toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </span>
        <span className={`px-1.5 rounded ${bgColor}`}>
          {isPositive ? "+" : ""}
          {data.changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
