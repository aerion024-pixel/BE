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
//UPDATE
//DELETE
