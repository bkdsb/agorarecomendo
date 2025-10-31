import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.RAINFOREST_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RAINFOREST_API_KEY ausente' }, { status: 500 });
    }
    const url = `https://api.rainforestapi.com/account?api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AgoraRecomendoBot/1.0' }, cache: 'no-store' });
    const text = await res.text();
    // Tentar JSON, se falhar devolver texto bruto
    try {
      const json = JSON.parse(text);
      return NextResponse.json({ ok: res.ok, status: res.status, data: json });
    } catch {
      return NextResponse.json({ ok: res.ok, status: res.status, data: text }, { status: res.ok ? 200 : res.status });
    }
  } catch (err) {
    console.error('rf-account check error:', err);
    return NextResponse.json({ error: 'Falha ao consultar Rainforest Account' }, { status: 500 });
  }
}
