import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/categories - Lista todas as categorias
export async function GET() {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/categories - Cria uma nova categoria
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name } = await request.json();
    if (!name || !name.trim()) {
      return new NextResponse('Nome é obrigatório', { status: 400 });
    }

    // Gera slug simples
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const category = await prisma.category.create({
      data: { name: name.trim(), slug },
    });

    return NextResponse.json(category);
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}