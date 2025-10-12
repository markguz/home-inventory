import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/lib/auth-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@homeinventory.local' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping...');
    return;
  }

  // Create default admin user
  const hashedPassword = await hashPassword('admin123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@homeinventory.local',
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN' as UserRole,
      emailVerified: new Date(),
    },
  });

  console.log('✓ Created admin user:', {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });

  // Create some sample categories
  const toolsCategory = await prisma.category.create({
    data: {
      name: 'Tools',
      description: 'Hand tools, power tools, and equipment',
      icon: '🔧',
      color: '#3b82f6',
      minQuantity: 1,
    },
  });

  const electronicsCategory = await prisma.category.create({
    data: {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      icon: '💻',
      color: '#8b5cf6',
      minQuantity: 0,
    },
  });

  console.log('✓ Created sample categories');

  // Create sample locations
  const garage = await prisma.location.create({
    data: {
      name: 'Garage',
      description: 'Main garage storage area',
    },
  });

  const basement = await prisma.location.create({
    data: {
      name: 'Basement',
      description: 'Basement storage',
    },
  });

  console.log('✓ Created sample locations');

  console.log('\n=== Seed completed successfully! ===');
  console.log('\nDefault admin credentials:');
  console.log('  Email: admin@homeinventory.local');
  console.log('  Password: admin123');
  console.log('\n⚠️  IMPORTANT: Change the admin password after first login!\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
