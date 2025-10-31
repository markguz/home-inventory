import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        location: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    console.error(`GET /api/items/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const body = await request.json();

    const item = await prisma.item.update({
      where: { id: params.id },
      data: body,
      include: {
        category: true,
        location: true,
      },
    });

    return NextResponse.json({ item }, { status: 200 });
  } catch (error: any) {
    console.error(`PUT /api/items/${params.id} error:`, error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    await prisma.item.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error(`DELETE /api/items/${params.id} error:`, error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
