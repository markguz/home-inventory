import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { itemSchema } from '@/lib/validations';
import { z } from 'zod';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoryId = searchParams.get('categoryId') || undefined;
    const locationId = searchParams.get('locationId') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Users can only see their own items, admins can see all
    const where = {
      ...(session.user.role !== 'ADMIN' && { userId: session.user.id }),
      ...(categoryId && { categoryId }),
      ...(locationId && { locationId }),
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
        orderBy: {
          [sortBy]: sortOrder,
        },
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
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Extract tagIds separately before validation
    const { tagIds, ...itemBody } = body;
    const validatedData = itemSchema.parse(itemBody);

    // Create item with optional tags, linking to current user
    const item = await prisma.item.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        ...(tagIds && Array.isArray(tagIds) && {
          tags: {
            create: tagIds.map((tagId: string) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        }),
      },
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

    return NextResponse.json(
      { success: true, data: item },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
