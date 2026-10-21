// import { Connection } from "mysql2";
import pool from "../config/db.js";
import { snap } from "../config/midtrans.js";

export const createTransaction = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      user_id,
      order_number,
      payment_method,
      subtotal,
      tax,
      total,
      items = [], pay = 0
    } = req.body;

    const userId = req.user?.id  || user_id

    await connection.beginTransaction();
    const isMidTrans = String(payment_method) === "1" || payment_method === "midTrans"
    let change = 0 
    let cashReceive
    let status = "pending"

    // if(!isMidTrans){
    if (!payment_method === 2) {
      cashReceive = Number(pay)
      if(cashReceive < Number(total)){
        await connection.rollback()
        return res.status(400).json({
          status: false,
          message: "short payment"
        })
      }
      change = cashReceive - Number(total)
      status = "settlement"
    }


    // const userId = req.user?.id;

    // const orderNumber = await generateOrderNumber(connection);
    // console.log("User", req.body);
    // console.log("order number", orderNumber);

    const [transaction] = await pool.query(
      "INSERT INTO orders (order_number, user_id, payment_method, subtotal, tax, total, pay, status) VALUES (?,?,?,?,?,?,?,?)",
      [order_number, userId, payment_method, subtotal, tax, total, pay, status],
    );
    // console.log("Test 1");
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
          gross_amount: Number(subtotal),
          callbacks: {
            finish: "http://localhost:5173/transaction/print"
          }
        },
        enable_payment: ["gopay"],
        item_details: items.map((item) => ({
          id: item.product_id,
          price: Number(item.price),
          quantity: Number(item.quantity),
          name: `Product ID${item.product_id}`,
        })),
      };
      midtransResponse = await snap.createTransaction(parameter);
    }
    await connection.commit();
    // connection.release();

    return res.status(201).json({
      status: true,
      message:
        Number(payment_method) === 1
          ? "Transaksi berhasil silahkan bayar dengan gopay"
          : "payment cash BERHASIL",
      order_id: orderId,
      order_number: order_number,
      payment_details: payment_method == 2 ? 
      {
        total : Number(total),
        cashReceive : cashReceive,
        change : change
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
    console.log("error:", error);
    await connection.rollback();
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  } finally {
    console.log("Finally");
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

const generateOrderNumber = async (Connection) => {
  //TR-19102026-0001
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const prefix = `TR-${year}${month}${date}-`;

  //query
  const [lastOrder] = await Connection.query(
    "SELECT order_number FROM orders WHERE order_number LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
    [`${prefix}`],
  );

  const nextNumber = 1;
  if (lastOrder.length > 0) {
    const lastNumber = lastOrder[0].order_number;
    const currentNumber = parseInt(lastNumber.split("-")[2], 10);
    if (!isNaN(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};
