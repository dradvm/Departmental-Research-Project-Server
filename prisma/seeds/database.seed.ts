import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
async function main() {
  console.log('Seed started');
  const user = await prisma.user.create({
    data: {
      email: 'h.nhu2003@gmail.com',
      password: await bcrypt.hash('123456', 10), // Hashing the password
      name: 'Huynh Nhu'
    }
  });
  console.log('User created: ', user);
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
