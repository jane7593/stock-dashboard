import { NextRequest, NextResponse } from "next/server";
import { fetchAllIndices, fetchHistorical, fetchQuote } from "@/lib/yahoo";

// 간단한 인메모리 캐시 (서버 재시작 시 초기화)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30초 캐시

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * GET /api/yahoo
 *   ?type=all                          → 전체 지수 현재가
 *   ?type=quote&symbol=^GSPC           → 단일 지수 현재가
 *   ?type=history&symbol=^GSPC&period=1mo  → 과거 데이터
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "all";
  const symbol = searchParams.get("symbol") ?? "";
  const period = (searchParams.get("period") ?? "1mo") as "1mo" | "3mo" | "6mo" | "1y";

  try {
    if (type === "all") {
      const cacheKey = "all_indices";
      const cached = getCached<ReturnType<typeof fetchAllIndices>>(cacheKey);
      if (cached) {
        return NextResponse.json({ data: await cached, cached: true });
      }
      const data = await fetchAllIndices();
      setCache(cacheKey, data);
      return NextResponse.json({ data, cached: false });
    }

    if (type === "quote") {
      if (!symbol) {
        return NextResponse.json({ error: "symbol is required" }, { status: 400 });
      }
      const cacheKey = `quote_${symbol}`;
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json({ data: cached, cached: true });
      }
      const data = await fetchQuote(symbol);
      if (!data) {
        return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
      }
      setCache(cacheKey, data);
      return NextResponse.json({ data, cached: false });
    }

    if (type === "history") {
      if (!symbol) {
        return NextResponse.json({ error: "symbol is required" }, { status: 400 });
      }
      const cacheKey = `history_${symbol}_${period}`;
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json({ data: cached, cached: true });
      }
      const data = await fetchHistorical(symbol, period);
      setCache(cacheKey, data);
      return NextResponse.json({ data, cached: false });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (error) {
    console.error("[API/yahoo] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
