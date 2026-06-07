import { PrismaClient, Role, VendorStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const vendorPassword = await bcrypt.hash('Vendor@123', 10);

  // ADMIN
  await prisma.user.upsert({
    where: {
      email: 'admin@foodapp.com',
    },
    update: {},
    create: {
      email: 'admin@foodapp.com',
      password: adminPassword,
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  // VENDOR
  const vendorUser = await prisma.user.upsert({
    where: {
      email: 'vendor@foodapp.com',
    },
    update: {},
    create: {
      email: 'vendor@foodapp.com',
      password: vendorPassword,
      role: Role.VENDOR,
      isVerified: true,
    },
  });

  await prisma.vendor.upsert({
    where: {
      userId: vendorUser.id,
    },
    update: {},
    create: {
      name: 'Demo Restaurant',
      userId: vendorUser.id,
      status: VendorStatus.ACTIVE,
      city: 'Abuja',
      state: 'FCT',
      deliveryRadiusKm: 20,
    },
  });

  console.log('Seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());