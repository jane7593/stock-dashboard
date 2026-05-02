export const INDICES = [
  { symbol: "^GSPC",     name: "S&P 500",    region: "🇺🇸 미국" },
  { symbol: "^IXIC",     name: "NASDAQ",     region: "🇺🇸 미국" },
  { symbol: "^DJI",      name: "다우존스",    region: "🇺🇸 미국" },
  { symbol: "^KS11",     name: "KOSPI",      region: "🇰🇷 한국" },
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
  ytdReturn: number; // YTD 수익률 추가
}

export async function fetchQuote(symbol: string): Promise<IndexQuote | null> {
  try {
    const encoded = encodeURIComponent(symbol);

    // 현재가 가져오기
    const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1d`;
    const quoteRes = await fetch(quoteUrl, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    });
    if (!quoteRes.ok) return null;
    const quoteData = await quoteRes.json();
    const meta = quoteData?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    // 연초 가격 가져오기 (YTD 계산용)
    const year = new Date().getFullYear();
    const startOfYear = `${year}-01-01`;
    const ytdUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&period1=${Math.floor(new Date(startOfYear).getTime() / 1000)}&period2=${Math.floor(Date.now() / 1000)}`;
    
    let ytdReturn = 0;
    try {
      const ytdRes = await fetch(ytdUrl, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
      });
      if (ytdRes.ok) {
        const ytdData = await ytdRes.json();
        const closes = ytdData?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
        if (closes && closes.length > 0) {
          const firstClose = closes.find((v: number | null) => v !== null);
          if (firstClose) {
            ytdReturn = ((price - firstClose) / firstClose) * 100;
          }
        }
      }
    } catch {}

    const indexInfo = INDICES.find((i) => i.symbol === symbol);

    return {
      symbol,
      name: indexInfo?.name ?? meta.symbol ?? symbol,
      region: indexInfo?.region ?? "",
      price,
      change,
      changePercent,
      marketState: meta.marketState ?? "CLOSED",
      ytdReturn,
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