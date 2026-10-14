import jwt from "jsonwebtoken"

export const verifyToken = (req, res, next) => {
const autHeader = req.headers.authorization
if(!autHeader || !autHeader.startsWith("Bearer ")){
    res.status(401).json({
        success: false,
        message: "unauthorize"
    })
}
const token = autHeader.split(" ")[1]

try {
    const decode = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decode
    next()
} catch (error) {
    res.status(401).json({
        success: false,
            message: "invalid credential"
    })
}
}