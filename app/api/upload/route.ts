import { NextResponse } from 'next/server';
import { writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return new NextResponse('Arquivo ausente', { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await stat(uploadsDir);
    } catch {
      await mkdir(uploadsDir, { recursive: true });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const fileName = `${Date.now()}_${safeName}`;
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;
    return NextResponse.json({ url });
  } catch (e) {
    return new NextResponse('Erro ao fazer upload', { status: 500 });
  }
}
