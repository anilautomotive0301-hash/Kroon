import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kroon.com' },
    update: {},
    create: {
      email: 'admin@kroon.com',
      name: 'Admin User',
      password: adminPass,
      role: Role.ADMIN,
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@kroon.com' },
    update: {},
    create: {
      email: 'supervisor@kroon.com',
      name: 'Supervisor User',
      password: await bcrypt.hash('super123', 12),
      role: Role.SUPERVISOR,
    },
  });

  const fieldStaff = await prisma.user.upsert({
    where: { email: 'field@kroon.com' },
    update: {},
    create: {
      email: 'field@kroon.com',
      name: 'Field Staff',
      password: await bcrypt.hash('field123', 12),
      role: Role.FIELD_STAFF,
    },
  });

  const tailor = await prisma.user.upsert({
    where: { email: 'tailor@kroon.com' },
    update: {},
    create: {
      email: 'tailor@kroon.com',
      name: 'Tailor One',
      password: await bcrypt.hash('tailor123', 12),
      role: Role.TAILOR,
    },
  });

  const campus = await prisma.campus.upsert({
    where: { code: 'DPS-001' },
    update: {},
    create: {
      name: 'Delhi Public School',
      code: 'DPS-001',
      address: '123 Main Street',
      city: 'Delhi',
      state: 'Delhi',
      contactName: 'Principal Sharma',
      contactPhone: '+91-9876543210',
      contactEmail: 'principal@dps.edu',
    },
  });

  const fabricItem = await prisma.fabricItem.upsert({
    where: { code: 'FAB-WHITE-COTTON' },
    update: {},
    create: {
      name: 'White Cotton Fabric',
      code: 'FAB-WHITE-COTTON',
      description: 'Premium white cotton for shirts',
      unit: 'meters',
      unitPrice: 120,
    },
  });

  console.log('Seed complete');
  console.log('Admin login: admin@kroon.com / admin123');
  console.log('Supervisor login: supervisor@kroon.com / super123');
  console.log('Field staff login: field@kroon.com / field123');
  console.log('Tailor login: tailor@kroon.com / tailor123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
