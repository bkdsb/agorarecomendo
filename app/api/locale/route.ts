import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { locale } = await req.json();
    const val = locale === 'pt-BR' ? 'pt-BR' : 'en-US';
    const res = NextResponse.json({ ok: true });
    res.cookies.set('locale', val, { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
    return res;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
