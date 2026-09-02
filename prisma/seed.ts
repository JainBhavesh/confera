import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name} for seeding.`);
  }
  return value;
}

async function main() {
  const orgName = requireEnv('SEED_ORG_NAME');
  const orgSlug = requireEnv('SEED_ORG_SLUG');
  const adminName = requireEnv('SEED_ADMIN_NAME');
  const adminEmail = requireEnv('SEED_ADMIN_EMAIL').toLowerCase();
  const adminPassword = requireEnv('SEED_ADMIN_PASSWORD');

  const organization = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: { name: orgName },
    create: { name: orgName, slug: orgSlug }
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, role: 'ADMIN', isActive: true, organizationId: organization.id },
    create: {
      organizationId: organization.id,
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  console.log(`Seeded organization "${organization.name}" (${organization.slug}) and admin ${admin.email}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
