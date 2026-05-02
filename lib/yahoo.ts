// 주요 해외 지수 심볼 목록
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
  previousClose: number;
  marketState: string;
}

/**
 * 더미 데이터 (테스트용)
 */
const dummyData: Record<string, IndexQuote> = {
  "^GSPC": { symbol: "^GSPC", name: "S&P 500", region: "🇺🇸 미국", price: 5200.5, change: 45.2, changePercent: 0.88, previousClose: 5155.3, marketState: "REGULAR" },
  "^IXIC": { symbol: "^IXIC", name: "NASDAQ", region: "🇺🇸 미국", price: 16800.2, change: 120.5, changePercent: 0.72, previousClose: 16679.7, marketState: "REGULAR" },
  "^DJI": { symbol: "^DJI", name: "다우존스", region: "🇺🇸 미국", price: 42100.0, change: 150.0, changePercent: 0.36, previousClose: 41950.0, marketState: "REGULAR" },
  "^N225": { symbol: "^N225", name: "니케이 225", region: "🇯🇵 일본", price: 28500.5, change: -50.2, changePercent: -0.18, previousClose: 28550.7, marketState: "CLOSED" },
  "^HSI": { symbol: "^HSI", name: "항셍", region: "🇭🇰 홍콩", price: 17800.3, change: 200.1, changePercent: 1.13, previousClose: 17600.2, marketState: "REGULAR" },
  "^FTSE": { symbol: "^FTSE", name: "FTSE 100", region: "🇬🇧 영국", price: 7900.4, change: 25.3, changePercent: 0.32, previousClose: 7875.1, marketState: "REGULAR" },
  "^GDAXI": { symbol: "^GDAXI", name: "DAX", region: "🇩🇪 독일", price: 18500.8, change: 80.2, changePercent: 0.44, previousClose: 18420.6, marketState: "REGULAR" },
  "000001.SS": { symbol: "000001.SS", name: "상하이종합", region: "🇨🇳 중국", price: 3100.2, change: -30.5, changePercent: -0.97, previousClose: 3130.7, marketState: "CLOSED" },
};

/**
 * 단일 지수 현재가 조회
 */
export async function fetchQuote(symbol: string): Promise<IndexQuote | null> {
  try {
    // 테스트용 더미 데이터 반환
    return dummyData[symbol] || null;
  } catch (error) {
    console.error(`[Yahoo] fetchQuote failed: ${symbol}`, error);
    return null;
  }
}

/**
 * 모든 지수 현재가 일괄 조회
 */
export async function fetchAllIndices(): Promise<IndexQuote[]> {
  return INDICES
    .map((idx) => dummyData[idx.symbol])
    .filter((data): data is IndexQuote => data !== undefined);
}

/**
 * 특정 지수의 과거 데이터 조회 (차트용)
 */
export async function fetchHistorical(
  symbol: string,
  period: "1mo" | "3mo" | "6mo" | "1y" = "1mo"
) {
  try {
    // 더미 차트 데이터 생성
    const days = { "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365 }[period];
    const data = [];
    const basePrice = 5200;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const variance = Math.sin(i / 10) * 100;
      
      data.push({
        date: dateStr,
        close: basePrice + variance,
        open: basePrice + variance - 20,
        high: basePrice + variance + 50,
        low: basePrice + variance - 50,
        volume: Math.floor(Math.random() * 100000000),
      });
    }

    return data;
  } catch (error) {
    console.error(`[Yahoo] fetchHistorical failed: ${symbol}`, error);
    return [];
  }
}