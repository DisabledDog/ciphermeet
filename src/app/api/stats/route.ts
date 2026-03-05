import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const STATS_FILE = join(process.cwd(), 'stats.json');

function getStats() {
  if (!existsSync(STATS_FILE)) {
    return { views: 0, visitors: new Set<string>(), pages: {} as Record<string, number> };
  }
  try {
    const raw = JSON.parse(readFileSync(STATS_FILE, 'utf-8'));
    return {
      views: raw.views || 0,
      visitors: new Set<string>(raw.visitors || []),
      pages: raw.pages || {},
    };
  } catch {
    return { views: 0, visitors: new Set<string>(), pages: {} as Record<string, number> };
  }
}

function saveStats(stats: { views: number; visitors: Set<string>; pages: Record<string, number> }) {
  writeFileSync(STATS_FILE, JSON.stringify({
    views: stats.views,
    visitors: Array.from(stats.visitors),
    pages: stats.pages,
  }));
}

// POST - record a page view
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const page = body.page || '/';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';

  const stats = getStats();
  stats.views++;
  stats.visitors.add(ip);
  stats.pages[page] = (stats.pages[page] || 0) + 1;
  saveStats(stats);

  return NextResponse.json({ ok: true });
}

// GET - read stats
export async function GET() {
  const stats = getStats();
  return NextResponse.json({
    totalViews: stats.views,
    uniqueVisitors: stats.visitors.size,
    pages: stats.pages,
  });
}
