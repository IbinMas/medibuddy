import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const emailsToDelete = ['quacinyadi@yahoo.com', 'Jamesweeba@gmail.com'];
  
  for (const email of emailsToDelete) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.pharmacy.delete({ where: { id: user.pharmacyId } });
      console.log(`Deleted pharmacy and user associated with ${email}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
