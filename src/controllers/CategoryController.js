import pool from "../config/db.js"

//GET ALL DATA
export const getAllCategories = async (req, res) => {
    try {
        
        const [categories] = await pool.query("SELECT * FROM categories ORDER BY id DESC")
        return res.status(200).json({
            status: true,
            total: categories.length,
            data: categories,
            message: "congrats"
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "get something else"
        })
    }
}
//GET ONE DATA
export const getCatByID = async(req, res) => {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)){
            return res.status(400).json({ status: false, message: "not a number honey"})
        }
        const [categories] = await pool.query("SELECT * from categories WHERE id=?", [id])
        if (categories.length === 0){
            return res.status(404).json({ status: false, message: "no data founded"})
        }
        return res.status(200).json({
            status: true, data: categories, message: "we find it"})
    } catch (error) {
        return res.status(500).json({
            status: false, message: "not found"
        })
    }
}
//CREATE
export const createCat = async (req, res) => {
    try {
        const { name } = req.body
        if(!name) {
            //400 : validation
            return res.status(400).json({
                status: false, message: "name required"
            })
        }
        const categories = await pool.query("INSERT INTO categories (name) VALUES (?)", [name])
        return res.status(201).json({
            status: true, data: categories, message: "you have a new one"
        })
    } catch (error) {
        if(error.code == "ER_DUP_ENTRY") {
            return res.status(400).json({
                status: false,
                message: "catName already exist"
            })
        }
        return res.status(500).json({
            status: false, message: "u dont get something new"
        })
    }
}
//UPDATE
export const updateCat = async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        const {name} = req.body
        if(isNaN(id)){
            return res.status(400).json({ status: false, message: "not a number honeyy"})
        }
        const [categories] = await pool.query("UPDATE categories SET name=?  WHERE id=?", [name, id])
        if (categories.length === 0){
            return res.status(404).json({
                status: false, message: "not found"
            })
        }
        return res.status(200).json({
            status: true, message: "up2date"
        })
    } catch (error) {
        return res.status(500).json({
            status: false, message: "still the old one"
        })
    }
}
//DELETE
export const deleteCat = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
    
    const [categories] = await pool.query("DELETE FROM categories WHERE id=?", [id]);
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