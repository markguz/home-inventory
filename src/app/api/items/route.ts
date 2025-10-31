import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const location = searchParams.get('location');

    const where: any = {};

    if (category) {
      where.category = {
        name: category,
      };
    }

    if (location) {
      where.location = {
        name: location,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        category: true,
        location: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, categoryId, locationId, userId } = body;

    // Validation
    if (!name || !categoryId || !locationId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const item = await prisma.item.create({
      data: {
        ...body,
        quantity: body.quantity || 1,
        condition: body.condition || 'good',
      },
      include: {
        category: true,
        location: true,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/items error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Item already exists' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
