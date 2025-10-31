import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      icon: '💻',
      color: '#3B82F6',
    },
  });

  const kitchen = await prisma.category.upsert({
    where: { name: 'Kitchen' },
    update: {},
    create: {
      name: 'Kitchen',
      description: 'Kitchen appliances and utensils',
      icon: '🍳',
      color: '#EF4444',
    },
  });

  const furniture = await prisma.category.upsert({
    where: { name: 'Furniture' },
    update: {},
    create: {
      name: 'Furniture',
      description: 'Furniture and home decor',
      icon: '🛋️',
      color: '#8B5CF6',
    },
  });

  // Create locations
  const office = await prisma.location.upsert({
    where: { name: 'Office' },
    update: {},
    create: {
      name: 'Office',
      description: 'Home office',
    },
  });

  const kitchenLocation = await prisma.location.upsert({
    where: { name: 'Kitchen' },
    update: {},
    create: {
      name: 'Kitchen',
      description: 'Kitchen area',
    },
  });

  const livingRoom = await prisma.location.upsert({
    where: { name: 'Living Room' },
    update: {},
    create: {
      name: 'Living Room',
      description: 'Main living area',
    },
  });

  const bedroom = await prisma.location.upsert({
    where: { name: 'Bedroom' },
    update: {},
    create: {
      name: 'Bedroom',
      description: 'Bedroom',
    },
  });

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password', // In production, this should be properly hashed
      role: 'USER',
    },
  });

  console.log('Created user:', user.email);
  console.log('Created categories:', electronics.name, kitchen.name, furniture.name);
  console.log('Created locations:', office.name, kitchenLocation.name, livingRoom.name, bedroom.name);

  // Create sample items
  await prisma.item.create({
    data: {
      name: 'Laptop',
      description: 'Dell XPS 15 - Work laptop',
      quantity: 1,
      purchasePrice: 1299.99,
      currentValue: 999.99,
      condition: 'excellent',
      notes: 'Extended warranty until 2026',
      userId: user.id,
      categoryId: electronics.id,
      locationId: office.id,
    },
  });

  await prisma.item.create({
    data: {
      name: 'Coffee Maker',
      description: 'Breville Barista Express',
      quantity: 1,
      purchasePrice: 599.99,
      condition: 'good',
      userId: user.id,
      categoryId: kitchen.id,
      locationId: kitchenLocation.id,
    },
  });

  await prisma.item.create({
    data: {
      name: 'Sofa',
      description: 'Grey sectional sofa',
      quantity: 1,
      purchasePrice: 1499.99,
      currentValue: 1200.00,
      condition: 'good',
      userId: user.id,
      categoryId: furniture.id,
      locationId: livingRoom.id,
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
