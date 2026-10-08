const USERS = [
  {
    nama: "nisa",
    email: "nisa99@gmail.com",
    password: "12345678",
  },
];

export const login = (req, res) => {
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
  const user = USERS.find((u) => u.email === email && u.password === password);
  if (!user) {
    //401: unauthorized :login gagal
    return res.status(401).json({
      status: false,
      message: "something wrong",
    });
  }
  res.status(200).json({
    status: "true",
    message: "good job",
    data: {
      user: {
        id: user.id,
        name: user.nama,
        email: user.email,
      },
      token: `jwt-token-123 ${user.id} - ${Date.now()}`,
    },
  });
};
