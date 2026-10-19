import { Connection } from "mysql2";
import pool from "../config/db.js";
import { snap } from "../config/midtrans.js";

export const createTransaction = async (req, res) => {
  const connection = await pool.getConnection();
  let committed = false; // track commit state so rollback isn't called after a successful commit
  try {
    await connection.beginTransaction();
    const {
      user_id,
      order_number,
      payment_method,
      subtotal,
      tax,
      total,
      items = [],
    } = req.body;

    // const userId = req.user?.id;

    const orderNumber = await generateOrderNumber(connection);
    // console.log("User", req.body);
    console.log("order number", orderNumber);

    // FIX: use connection.query() (not pool.query()) so these INSERTs
    // run inside the transaction and can be rolled back on error.
    const [transaction] = await connection.query(
      "INSERT INTO orders (order_number, user_id, payment_method, subtotal, tax, total) VALUES (?,?,?,?,?,?)",
      [orderNumber, user_id, payment_method, subtotal, tax, total],
    );
    console.log("Test 1");
    const orderId = transaction.insertId;
    if (items) {
      for (let item of items) {
        await connection.query(
          "INSERT INTO order_details (order_id, product_id, quantity, price) VALUES (?,?,?,?)",
          [orderId, item.product_id, item.quantity, item.price],
        );
      }
    }

    // FIX: commit the DB transaction BEFORE calling the external Midtrans API.
    // The FOR UPDATE lock in generateOrderNumber was held for the entire Midtrans
    // call, blocking every concurrent INSERT into orders.  Committing here releases
    // the lock in milliseconds; Midtrans runs after the DB is free.
    await connection.commit();
    committed = true;

    let midtransResponse = null;
    if (payment_method === 1) {
      const parameter = {
        transaction_details: {
          order_id: orderNumber,
          gross_amount: total,
        },
        enable_payment: ["gopay"],
        item_details: items.map((item) => ({
          id: item.product_id,
          price: item.price,
          quantity: item.quantity,
          name: `Product ID${item.product_id}`,
        })),
      };
      midtransResponse = await snap.createTransaction(parameter);
    }

    return res.status(201).json({
      status: true,
      message:
        Number(payment_method) === 1
          ? "Transaksi berhasil silahkan bayar dengan gopay"
          : "payment cash BERHASIL",
      order_id: orderId,
      order_number: orderNumber,
      payment_gateway: midtransResponse
        ? {
            token: midtransResponse.token,
            redirect_url: midtransResponse.redirect_url,
          }
        : null,
    });
  } catch (error) {
    console.log("error:", error);
    // FIX: only rollback if the transaction has not been committed yet.
    // Calling rollback() after commit() throws and masks the real error.
    if (!committed) {
      await connection.rollback();
    }
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  } finally {
    // FIX: release only here (the try block previously called release() a
    // second time right after commit(), which could return the connection to
    // the pool before the finally block had a chance to run).
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
  
    // Format target: TR-19102026-0001
    const now = new Date();

    // Menggunakan PadStart agar tanggal dan bulan selalu 2 digit (DDMMYYYY)
    const date = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0"); // getMonth() dimulai dari 0 (Januari = 0)
    const year = now.getFullYear();

    const prefix = `TR-${date}${month}${year}-`;

    // Melakukan query untuk mencari order_number terakhir dengan prefix hari ini
    const [lastOrder] = await Connection.query(
      "SELECT order_number FROM orders WHERE order_number LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
      [`${prefix}%`], // Menambahkan '%' agar klausa LIKE berfungsi mencari suffix-nya
    );

    let nextNumber = 1; // Menggunakan 'let', karena nilai ini akan diubah (const akan error)

    if (lastOrder && lastOrder.length > 0) {
      const lastOrderNumber = lastOrder[0].order_number;
      // lastOrderNumber berbentuk: TR-19102026-0001
      // split("-") menghasilkan array: ['TR', '19102026', '0001']
      const parts = lastOrderNumber.split("-");

      if (parts.length === 3) {
        const currentNumber = parseInt(parts[2], 10);
        if (!isNaN(currentNumber)) {
          nextNumber = currentNumber + 1;
        }
      }
    }
    console.log("Masuk");
    return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};
