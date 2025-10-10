import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { locationSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: {
        _count: {
          select: { items: true },
        },
        parent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = locationSchema.parse(body);

    const location = await prisma.location.create({
      data: validatedData,
    });

    return NextResponse.json(
      { success: true, data: location },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
