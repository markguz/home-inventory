import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { itemUpdateSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.item.findUnique({
      where: { id },
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
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = itemUpdateSchema.parse({ ...body, id });

    const { tagIds, ...updateData } = validatedData;

    // If tagIds are provided, update the tags
    const item = await prisma.item.update({
      where: { id },
      data: {
        ...updateData,
        ...(tagIds !== undefined && {
          tags: {
            deleteMany: {},
            create: tagIds.map((tagId) => ({
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

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
