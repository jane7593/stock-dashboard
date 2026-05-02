export interface AlphaVantageQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export async function fetchAlphaVantageQuote(
  symbol: string
): Promise<AlphaVantageQuote | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY;
    if (!apiKey) {
      console.error("Alpha Vantage API key not found");
      return null;
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );

    const data = await response.json();

    if (data["Error Message"]) {
      console.error(`Alpha Vantage error: ${data["Error Message"]}`);
      return null;
    }

    const quote = data["Global Quote"];
    if (!quote || !quote["05. price"]) {
      return null;
    }

    return {
      symbol,
      name: quote["01. symbol"] || symbol,
      price: parseFloat(quote["05. price"]),
      change: parseFloat(quote["09. change"]) || 0,
      changePercent: parseFloat(quote["10. change percent"]) || 0,
      timestamp: quote["07. latest trading day"] || new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[Alpha Vantage] fetchQuote failed: ${symbol}`, error);
    return null;
  }
}