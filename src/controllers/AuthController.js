import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

import pool from "../config/db.js"
import prisma from "../config/prisma.js";



export const login = async (req, res) => {
  //const email = req.body.email
  const { email, password } = req.body;

  //find
  // const user = USERS.find((u) => u.email === email && u.password === password);
  

  try {
    const user = await prisma.user.findUnique({
      where: {email: email},
    })
    if (!user){
      return res.status(401).json({
      status: false,
      message: "something wrong",
    });
    }
    const isMatch = await bcrypt.compare(password, user.password)

if (!isMatch) {
  return res.status(401).json({
      status: false,
      message: "something wrong",
    });
}
const token = jwt.sign({
  id: user.id,
  nama: user.id,
  email: user.email,
},
process.env.JWT_SECRET,
{expiresIn: process.env.JWT_EXPRESS_IN || "1d"},
)

  res.status(200).json({
    status: "true",
    message: "good job",
    data: {
      user: {
        id: user.id,
        name: user.nama,
        email: user.email,
      },
      token,
    },
  });
  } catch (error) {
    res.status(500).json({status: false, message: "internal server error", error: error.message})
  }
  // const [user] = await pool.query("SELECT id, name, email, password FROM users WHERE email=?", [email])
  // if(user.length === 0){
  //   return res.status(401).json({
  //     status: false,
  //     message: "something wrong",
  //   });
  // }
// const dataUser = user [0]
// const isMatch = await bcrypt.compare(password, dataUser.password)

// if (!isMatch) {
//   return res.status(401).json({
//       status: false,
//       message: "something wrong",
//     });
// }
//   // if (!user) {
//   //   //401: unauthorized :login gagal
//   //   return res.status(401).json({
//   //     status: false,
//   //     message: "something wrong",
//   //   });
//   // }
// const token = jwt.sign({
//   id: dataUser.id,
//   nama: dataUser.id,
//   email: dataUser.email,
// },
// process.env.JWT_SECRET,
// {expiresIn: process.env.JWT_EXPRESS_IN || "1d"},
// )

//   res.status(200).json({
//     status: "true",
//     message: "good job",
//     data: {
//       user: {
//         id: dataUser.id,
//         name: dataUser.nama,
//         email: dataUser.email,
//       },
//       token,
//     },
//   });
};

export const me = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      }
    })
    // const [row] = await pool.query("SELECT id, name, email FROM users WHERE id=?", [userId])
    return res.status(200).json({
      status: true, data: user,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "internal server error",
      error: error.message, 
    })
  }
}