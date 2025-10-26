import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const MARKETS_FILE = join(process.cwd(), 'public', 'markets.json');

// ✅ SAVE market to JSON
export async function POST(request: NextRequest) {
  try {
    const marketData = await request.json();

    // ✅ Keep only what you need
    const filteredMarket = {
      id: marketData.id,
      data_id: marketData.data_id,
      data_question: marketData.data_question,
      imageUrl: marketData.imageUrl || '/1.jpeg',
      outcomes: marketData.outcomes || [],
      chartData: marketData.chartData || []
    };

    // ✅ Read file if exists
    let markets = [];
    try {
      const data = await readFile(MARKETS_FILE, 'utf-8');
      markets = JSON.parse(data);
    } catch {
      markets = [];
    }

    // ✅ Prevent duplicate entry by ID
    const existingIndex = markets.findIndex((m: any) => m.id === filteredMarket.id);
    if (existingIndex > -1) {
      markets[existingIndex] = filteredMarket;
    } else {
      markets.push(filteredMarket);
    }

    // ✅ Write updated data
    await writeFile(MARKETS_FILE, JSON.stringify(markets, null, 2), 'utf-8');

    return NextResponse.json({ success: true, market: filteredMarket });
  } catch (error: any) {
    console.error('❌ Error saving market:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ READ markets from JSON
export async function GET() {
  try {
    const data = await readFile(MARKETS_FILE, 'utf-8');
    const markets = JSON.parse(data);
    return NextResponse.json(markets);
  } catch (error) {
    console.error('❌ Error reading markets file:', error);
    return NextResponse.json([]);
  }
}
