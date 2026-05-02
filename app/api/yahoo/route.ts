import { NextRequest, NextResponse } from "next/server";
import { fetchAllIndices, fetchQuote } from "@/lib/yahoo";

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30 * 1000;

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "all";
  const symbol = searchParams.get("symbol") ?? "";

  try {
    if (type === "all") {
      const cacheKey = "all_indices";
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json({ data: cached, cached: true });
      }
      const data = await fetchAllIndices();
      setCache(cacheKey, data);
      return NextResponse.json({ data, cached: false });
    }

    if (type === "quote") {
      if (!symbol) {
        return NextResponse.json(
          { error: "symbol is required" },
          { status: 400 }
        );
      }
      const cacheKey = `quote_${symbol}`;
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json({ data: cached, cached: true });
      }
      const data = await fetchQuote(symbol);
      if (!data) {
        return NextResponse.json(
          { error: "Failed to fetch quote" },
          { status: 500 }
        );
      }
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