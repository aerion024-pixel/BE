import prisma from "../../src/config/prisma.js";
import bcrypt from "bcrypt"

export const userSeeder = async() => {
    const password = await bcrypt.hash("12345678", 10)
    await prisma.user.create({
        data:{
            name: "admin",
            email: "admin@gmail.com",
            password: password
        }
    })
    console.log("user Seed!")
}