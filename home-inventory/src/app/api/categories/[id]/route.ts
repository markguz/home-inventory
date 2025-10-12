import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { categorySchema } from '@/lib/validations';
import { z } from 'zod';

// GET single category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT update category by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input data
    const validatedData = categorySchema.parse(body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it conflicts with another category
    if (validatedData.name !== existingCategory.name) {
      const nameConflict = await prisma.category.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'A category with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE category by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has items
    if (existingCategory._count.items > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${existingCategory._count.items} item(s). Please reassign or delete the items first.`,
        },
        { status: 409 }
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
