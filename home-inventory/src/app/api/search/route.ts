import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId');
    const locationId = searchParams.get('locationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const where = {
      AND: [
        query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' as const } },
                { description: { contains: query, mode: 'insensitive' as const } },
                { serialNumber: { contains: query, mode: 'insensitive' as const } },
                { barcode: { contains: query, mode: 'insensitive' as const } },
              ],
            }
          : {},
        categoryId ? { categoryId } : {},
        locationId ? { locationId } : {},
      ],
    };

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
          location: {
            select: { id: true, name: true },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error searching items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search items' },
      { status: 500 }
    );
  }
}
