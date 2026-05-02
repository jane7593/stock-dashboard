export const INDICES = [
  { symbol: "^GSPC",     name: "S&P 500",    region: "🇺🇸 미국" },
  { symbol: "^IXIC",     name: "NASDAQ",     region: "🇺🇸 미국" },
  { symbol: "^DJI",      name: "다우존스",    region: "🇺🇸 미국" },
  { symbol: "^N225",     name: "니케이 225",  region: "🇯🇵 일본" },
  { symbol: "^HSI",      name: "항셍",        region: "🇭🇰 홍콩" },
  { symbol: "^FTSE",     name: "FTSE 100",   region: "🇬🇧 영국" },
  { symbol: "^GDAXI",    name: "DAX",        region: "🇩🇪 독일" },
  { symbol: "000001.SS", name: "상하이종합",  region: "🇨🇳 중국" },
];

export interface IndexQuote {
  symbol: string;
  name: string;
  region: string;
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
}

export async function fetchQuote(symbol: string): Promise<IndexQuote | null> {
  try {
    const encoded = encodeURIComponent(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1d`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    const indexInfo = INDICES.find((i) => i.symbol === symbol);

    return {
      symbol,
      name: indexInfo?.name ?? meta.symbol ?? symbol,
      region: indexInfo?.region ?? "",
      price,
      change,
      changePercent,
      marketState: meta.marketState ?? "CLOSED",
    };
  } catch (error) {
    console.error(`[Yahoo] fetchQuote failed: ${symbol}`, error);
    return null;
  }
}

export async function fetchAllIndices(): Promise<IndexQuote[]> {
  const results = await Promise.allSettled(
    INDICES.map((i) => fetchQuote(i.symbol))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<IndexQuote> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);
}