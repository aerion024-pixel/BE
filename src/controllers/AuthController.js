import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

import pool from "../config/db.js"

const USERS = [
  {
    id: 1,
    nama: "nisa",
    email: "nisa99@gmail.com",
    password: "12345678",
  },
];

export const login = async (req, res) => {
  //const email = req.body.email
  const { email, password } = req.body;

  if (!email || !password) {
    // 400: bad response (browser)
    // 500: server error (server/database)
    // 200: success (success)
    res.status(400).json({
      status: false,
      message: "Email or Password needed",
    });
  }
  //find
  // const user = USERS.find((u) => u.email === email && u.password === password);
  const [user] = await pool.query("SELECT id, name, email, password FROM users WHERE email=?", [email])
  if(user.length === 0){
    return res.status(401).json({
      status: false,
      message: "something wrong",
    });
  }
const dataUser = user [0]
const isMatch = await bcrypt.compare(password, dataUser.password)

if (!isMatch) {
  return res.status(401).json({
      status: false,
      message: "something wrong",
    });
}
  // if (!user) {
  //   //401: unauthorized :login gagal
  //   return res.status(401).json({
  //     status: false,
  //     message: "something wrong",
  //   });
  // }
const token = jwt.sign({
  id: dataUser.id,
  nama: dataUser.id,
  email: dataUser.email,
},
process.env.JWT_SECRET,
{expiresIn: process.env.JWT_EXPRESS_IN || "1d"},
)

  res.status(200).json({
    status: "true",
    message: "good job",
    data: {
      user: {
        id: dataUser.id,
        name: dataUser.nama,
        email: dataUser.email,
      },
      token,
    },
  });
};
