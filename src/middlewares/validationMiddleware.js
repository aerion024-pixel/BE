export const validate = (schema) => (req, res, next) => {
    const {error, value} = schema.validate(req.body, {aboutEarly: false});

    if(error){
        const formattedErrors = error.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message.replace(/['"]/g, ""),
            // (/['"]/g) untuk
        }));
        return res.status(422).json({
            success: false,
            // message: error.details.map(err => err.message)
            message: formattedErrors[0].message,
            errors: formattedErrors,
        });
    }

req.body = value;

    next();
};