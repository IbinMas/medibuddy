import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, emailVerifiedAt: true, role: true }
  });
  console.log(`Users found: ${users.length}`);
  users.forEach(u => console.log(`- ${u.email} [Verified: ${u.emailVerifiedAt ? 'Yes' : 'No'}] (${u.role})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
