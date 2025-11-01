import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { itemUpdateSchema } from '@/lib/validations';
import { z } from 'zod';
// SECURITY: Import NextAuth for session management
import { auth } from '@/auth';

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
    // SECURITY: Check authentication - user must be logged in
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // SECURITY: Check if item exists before attempting update
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // SECURITY: Verify ownership - user can only edit their own items OR be admin
    const isOwner = existingItem.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You do not have permission to edit this item' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = itemUpdateSchema.parse({ ...body, id });

    const { tagIds, id: _, ...updateData } = validatedData;

    // Build the update data object conditionally, filtering out undefined values
    const dataToUpdate: Record<string, unknown> = {};

    // Only include fields that are actually present in the update
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        dataToUpdate[key] = value;
      }
    });

    // SECURITY: Validate foreign key references before update
    if (updateData.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: updateData.categoryId as string },
      });
      if (!categoryExists) {
        return NextResponse.json(
          { success: false, error: 'Invalid categoryId - Category does not exist' },
          { status: 400 }
        );
      }
    }

    if (updateData.locationId) {
      const locationExists = await prisma.location.findUnique({
        where: { id: updateData.locationId as string },
      });
      if (!locationExists) {
        return NextResponse.json(
          { success: false, error: 'Invalid locationId - Location does not exist' },
          { status: 400 }
        );
      }
    }

    // SECURITY: Validate tag references if provided
    if (tagIds !== undefined && Array.isArray(tagIds) && tagIds.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: { id: { in: tagIds as string[] } },
        select: { id: true },
      });

      if (existingTags.length !== tagIds.length) {
        return NextResponse.json(
          { success: false, error: 'Invalid tagIds - One or more tags do not exist' },
          { status: 400 }
        );
      }

      // Add tags update if provided
      dataToUpdate.tags = {
        deleteMany: {},
        create: tagIds.map((tagId: string) => ({
          tag: { connect: { id: tagId } },
        })),
      };
    }

    const item = await prisma.item.update({
      where: { id },
      data: dataToUpdate,
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
