import pool from "../config/db.js";
const USERS = [
  {
    id: 1,
    name: "nisa",
    email: "nisa99@gmail.com",
    password: "12345678",
  },
  {
    id: 2,
    name: "diaz",
    email: "diaz99@gmail.com",
    password: "12345678",
  },
  {
    id: 3,
    name: "api",
    email: "api99@gmail.com",
    password: "12345678",
  },
];

//crud(create, read, update, delete)

// read

//single thread function
export const getAllUser = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, is_active FROM users",
    );

    return res.status(200).json({
      status: true,
      message: "thats so fetch",
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "fail fetch user",
      error: error.message,
    });
  }
};
export const getUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id); //1
    //find
    const [user] = await pool.query(
      "SELECT id, name, email, is_active FROM users WHERE id= ?",
      [id],
    );
    if (!user) {
      res.status(404).json({
        status: false,
        message: "nihil????",
      });
    }

    res.status(200).json({
      status: true,
      message: "Thisss",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "fail fetch user",
      error: error.message,
    });
  }
};

export const createUser = async (req, res) => {
  //destruct
  const { name, email, password } = req.body;
  //const name = req.body.name
  //const password =req.body.password
  try {
    // const newUser = {
    //   id: USERS.length > 0 ? USERS[USERS.length - 1].id + 1 : 1,
    //   name, //kalau sama langsung name saja
    //   email,
    //   password,
    // };
    // USERS.push(newUser);
    // return res.status(201).json({
    //   status: true,
    //   message: "succ",
    //   data: USERS,
    // });
    const [user] = await pool.query(
      "INSERT INTO users(name, email, password) VALUES (?, ?, ?)",
      [name, email, password],
    );
    return res.status(201).json({
      status: true,
      message: "create user succ",
      // data: user,
      data: { id: user.insertId, name, email },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "get a life",
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, password } = req.body;
  const [user] = await pool.query(
    "UPDATE users SET name=?, email=?, password=? WHERE id=?",
    [name, email, password, id],
  );
  //   const userIndex = USERS.findIndex((u) => u.id === id);
  //   USERS[userIndex] = {
  //     ...USERS[userIndex],
  //     ...(name && { name }),
  //     ...(email && { email }),
  //     ...(password && { password }),
  try {
    return res.status(200).json({
      status: true,
      message: "up2date",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "get a new one",
      error: error.message,
    });
  }
};

//untuk update dan delete harus ada id
export const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
  
    const [user] = await pool.query("DELETE FROM users WHERE id=?", [id]);
    return res.status(200).json({
      status: true,
      message: "delete succ",
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "get a new one",
      error: error.message,
    });
  }
};
