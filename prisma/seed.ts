import { PrismaClient, Role, VendorStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ADMIN (OTP-based)
  const adminUser = await prisma.user.upsert({
    where: {
      phoneNumber: '+2349150242622',
    },
    update: {},
    create: {
      phoneNumber: '+2349150242622',
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  // VENDOR (OTP-based)
  const vendorUser = await prisma.user.upsert({
    where: {
      phoneNumber: '+2349066294339',
    },
    update: {},
    create: {
      phoneNumber: '+2349066294339',
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

  console.log('OTP-only seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());