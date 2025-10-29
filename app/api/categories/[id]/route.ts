import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// DELETE /api/categories/[id] - Remove uma categoria (desassociando produtos primeiro)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Remove associação de produtos
    await prisma.product.updateMany({
      where: { categoryId: params.id },
      data: { categoryId: null },
    });

    // Deleta a categoria
    await prisma.category.delete({ where: { id: params.id } });

    return new NextResponse('Categoria deletada', { status: 200 });
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
