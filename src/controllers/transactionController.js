import pool from "../config/db.js";
import { snap } from "../config/midtrans.js";

export const createTransaction = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const {
        order_number,
        user_id,
        payment_method,
        subtotal,
        tax,
        total,
        items,
    } = req.body;
    const [transaction] = await pool.query(
        "INSERT INTO orders (order_number, user_id, payment_method, subtotal, tax, total) VALUES (?,?,?,?,?,?)",
        [order_number, user_id, payment_method, subtotal, tax, total]);
    const orderId = transaction.insertId;
    if (items) {
        for (let item of items) {
        await pool.query(
            "INSERT INTO order_details (order_id, product_id, quantity, price) VALUES (?,?,?,?)",
            [orderId, item.product_id, item.quantity, item.price]);
        }
    }
    let midtransResponse = null;
    if (payment_method === 1) {
        const parameter = {
            transaction_details : {
                order_id : order_number,
                gross_amount : total,
            },
            enable_payment:['gopay'],
            item_details : items.map(item => ({
                id: item.product_id,
                price : item.price,
                quantity : item.quantity,
                name: `Product ID${item.product_id}`
            }))
        }
        midtransResponse = await snap.createTransaction(parameter)
    }
    await connection.commit()    
    connection.release()

    return res.status(201).json({
        status: true,
        message: Number(payment_method) === 1 ? "Transaksi berhasil silahkan bayar dengan gopay" : "payment cash BERHASIL",
        order_id : orderId,
        order_number: order_number,
        payment_gateway: midtransResponse ? {
        token : midtransResponse.token,
        redirect_url : midtransResponse.redirect_url
        } :
        null,
    });
    } catch (error) {
    return res.status(500).json({
        status: false,
        message: error.message,
    });
    }
    };
