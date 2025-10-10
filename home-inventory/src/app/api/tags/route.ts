import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { tagSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { itemTags: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = tagSchema.parse(body);

    const tag = await prisma.tag.create({
      data: validatedData,
    });

    return NextResponse.json(
      { success: true, data: tag },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
