import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  const username = process.env.PANEL_ADMIN_USERNAME || 'admin'
  const password = process.env.PANEL_ADMIN_PASSWORD
  if (!password) {
    console.error('PANEL_ADMIN_PASSWORD not set, admin user not created')
    return
  }
  const hashed = await hashPassword(password)
  await prisma.user.upsert({
    where: { username },
    update: { password: hashed },
    create: { username, password: hashed },
  })
  console.log(`Admin user "${username}" created/updated`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())