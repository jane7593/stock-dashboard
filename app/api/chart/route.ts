import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "";
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${start}&period2=${end}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    });

    const data = await res.json();
    const timestamps = data?.chart?.result?.[0]?.timestamp ?? [];
    const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];

    const chartData = timestamps
      .map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().split("T")[0],
        close: closes[i] ?? null,
      }))
      .filter((d: any) => d.close !== null);

    return NextResponse.json({ data: chartData });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chart" }, { status: 500 });
  }
}