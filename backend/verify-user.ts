import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const email = 'signup-admin@kwasi.test';
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`User ${email} not found.`);
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { emailVerifiedAt: new Date() },
  });

  console.log(`User ${email} verified at ${updated.emailVerifiedAt}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
