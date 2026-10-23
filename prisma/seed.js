import prisma from "../src/config/prisma.js"
import { userSeeder } from "./seeder/user.seeder.js"

async function main () {
await userSeeder()
}

main().catch((e) => {
    console.error
    process.exit(1)
}).finally(async() => {
    await prisma.$disconnect()
})