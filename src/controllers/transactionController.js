import { Connection } from "mysql2";
import pool from "../config/db.js";
import { snap } from "../config/midtrans.js";

export const createTransaction = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      order_number,
      user_id,
      payment_method,
      subtotal,
      tax,
      total,
      items = [],
      pay = 0,
    } = req.body;

    const userId = req.user?.id;

    await connection.beginTransaction();
    // const orderNumber = await generateOrderNumber(connection) || order_number;
    // console.log("order number", orderNumber);
    // console.log(req.user);
    const isMidtrans =
      String(payment_method) === "1" || payment_method === "midtrans";
    // const isMidtrans =
    //   String(payment_method) === "1" || payment_method === "midtrans";
    let change = 0;
    let cashReceive = 0;
    let status = "pending";

    if (payment_method === 2) {
      cashReceive = Number(pay);
      if (cashReceive < Number(total)) {
        await connection.rollback();
        return res.status(400).json({
          status: false,
          message: "Cash less then the total",
        });
      }
      change = cashReceive - Number(total);
      status = "settlement";
    }

    const [transaction] = await pool.query(
      "INSERT INTO orders (order_number, user_id, payment_method, subtotal, tax, total, pay, status) VALUES (?,?,?,?,?,?,?,?)",
      [order_number, userId, payment_method, subtotal, tax, total, pay, status],
    );

    const orderId = transaction.insertId;
    if (items) {
      for (let item of items) {
        await pool.query(
          "INSERT INTO order_details (order_id, product_id, quantity, price) VALUES (?,?,?,?)",
          [orderId, item.product_id, item.quantity, item.price],
        );
      }
    }
    let midtransResponse = null;
    if (Number(payment_method) === 1) {
      const parameter = {
        transaction_details: {
          order_id: order_number,
          gross_amount: subtotal,
        },
        callbacks: {
          finish: "http://localhost:5173/transaction/print",
        },
        enable_payment: ["gopay"],
        item_details: items.map((item) => ({
          id: item.product_id,
          price: item.price,
          quantity: item.quantity,
          name: `Product ID ${item.product_id}`,
        })),
      };

      midtransResponse = await snap.createTransaction(parameter);
    }
    await connection.commit();
    connection.release();
    return res.status(201).json({
      status: true,
      message:
        Number(payment_method) === 1
          ? "Order Berhasil Silahkan Bayar dengan Gopay"
          : "payment cash Berhasil",
      order_id: orderId,
      order_number: order_number,
      payment_details:
        payment_method === 2
          ? {
              total: Number(total),
              cashReceive: cashReceive,
              change: change,
            }
          : null,
      payment_gateway: midtransResponse
        ? {
            token: midtransResponse.token,
            redirect_url: midtransResponse.redirect_url,
          }
        : null,
    });
  } catch (error) {
    // rollback = memastikan apakah semua nya berhasil lalu untuk membalikan ke kita untuk membenarkan semua data hasil nya apa, ketika udah di rollback untuk membenarkan yg error...semua udah tdk ada yg error tinggal nambahin release di finally.
    // beginTransaction untuk melakukan aksi kedua table (update)
    await connection.rollback();
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  } finally {
    connection.release();
  }
};

export const getAllTransaction = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT
        orders.id,
        orders.order_number,
        orders.payment_method,
        order_details.product_id,
        products.name
        FROM orders
        LEFT JOIN order_details ON orders.id = order_details.order_id
        LEFT JOIN products ON order_details.product_id = products.id ORDER BY orders.id DESC`);

    const orderMap = {};
    rows.forEach((row) => {
      if (!orderMap[row.id]) {
        orderMap[row.id] = {
          id: row.id,
          order_number: row.order_number,
          payment_method: row.payment_method,
          items: [],
        };
      }
      if (row.product_id) {
        orderMap[row.id].items.push({
          product_id: row.product_id,
          name: row.name,
        });
      }
    });
    const orders = Object.values(orderMap);
    return res.status(200).json({
      status: true,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [rows] = await pool.query(
      `SELECT
          orders.*,
          order_details.product_id,
          order_details.quantity,
          order_details.price,
          products.name
          FROM orders
          LEFT JOIN order_details ON orders.id = order_details.order_id
          LEFT JOIN products ON order_details.product_id = products.id 
          WHERE orders.order_number = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Data Transaction not found",
      });
    }

    const transaction = {
      id: rows[0].id,
      order_number: rows[0].order_number,
      user_id: rows[0].user_id,
      payment_method: rows[0].payment_method,
      subtotal: rows[0].subtotal,
      total: rows[0].total,
      tax: rows[0].tax,
      pay: rows[0].pay,
      status: rows[0].status,
      items: [],
    };

    rows.forEach((row) => {
      if (row.product_id) {
        transaction.items.push({
          product_id: row.product_id,
          name: row.name,
          quantity: row.quantity,
          price: row.price,
        });
      }
    });

    // const orders = Object.values(orderMap);
    return res.status(200).json({
      status: true,
      message: "Fetch data transaction success",
      data: transaction,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

const generateOrderNumber = async (connection) => {
  // setelah async itu namanya parameter yg di dalam ().
  // TR-19102026-001
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const prefix = `TR-${year}${month}${date}-`;

  // query untuk melihat atau pilih dari data orders
  const [lastOrder] = await connection.query(
    "SELECT order_number FROM orders WHERE order_number LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
    [`${prefix}`],
  );
  // yg LIKE di ambil dari prefix
  // prefix =
  // lastOrder akan mengahasilkan output data lalu nilai dari lasOrder terus nanti ada object lagi.
  // supaya nanti hasilnya ke orderNumber kita pakein tanda [] di lasOrder const nya

  let nextNumber = 1;
  if (lastOrder.length > 0) {
    const lastNumber = lastOrder[0].order_number;
    const currentNumber = parseInt(lastNumber.split("-")[2], 10);
    if (!isNaN(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};
// untuk menambahkan karatker di belakang padEnd
// untuk menambahkan karakter di depan padStart

// split di javascript fungsinya itu, bakalan jadi array di setiap kata" teks nya.
// NaN : not a number
// 10+"string" = NaN
// 0 karena data nya cuma satu
