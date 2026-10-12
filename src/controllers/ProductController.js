import pool from "../config/db.js";

//GETALL
export const getAllProducts = async (req, res) => {
  try {
    const [products] = await pool.query(
      "SELECT products.*, categories.name AS category_name FROM products LEFT JOIN categories ON products.category_id = categories.id",
    );
    return res.status(200).json({
      status: true,
      total: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "get something else",
    });
  }
};

//GET ONE DATA
export const getProByID = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [products] = await pool.query(
        "SELECT products.*, categories.name AS category_name FROM products LEFT JOIN categories ON products.category_id = categories.id WHERE products.id=?",
      [id],
    );
    if(products.length === 0){
        return res.status(404).json({
        status: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
      status: true,
      data: products[0],
      message: "this is what you looking for",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
//CREATE

export const createProduct = async (req, res) => {
  try {
    const { category_id, name, price, stock, description } = req.body
    await pool.query("INSERT INTO products (category_id, name, price, stock, description) VALUES (?,?,?,?,?)", [category_id, name, price, stock, description])
    return res.status(201).json({
      status: true,
        message: "you have a new one",
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
} 
//UPDATE
export const updateProduct = async (req, res) => {
try {
  const id = parseInt(req.params.id)
  const {  category_id, name, price, stock, description, is_active } = req.body
  await pool.query("UPDATE products SET category_id=?, name=?, price=?, stock=?, description=?, is_active=? WHERE id=?", [category_id, name, price, stock, description, is_active ?? 1, id])
            return res.status(200).json({
            status: true, message: "up2date"
        })
} catch (error) {
  return res.status(500).json({
            status: false, message: error.message
        })
}
}
//DELETE
export const deleteProduct = async (req, res) => {
  try {
  const id = parseInt(req.params.id);
    const [products] = await pool.query("DELETE FROM products WHERE id=?", [id]);
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
}
