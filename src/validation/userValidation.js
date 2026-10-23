import Joi from "joi";
// create
export const createSchema = Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().trim().email().required().messages({
        // trim itu untuk menghapus spasi yg berlebih.
        "string.empty" : "Email cannot be empty",
        "string.email" : "The email format must be an email address",
        "string.required" : "Email is required",
    }),
    password: Joi.string().min(8).required().messages({
        "string.empty" : "Password cannot be empty",
        "string.min" : "Minimum password length is 8 characters",
        "string.required" : "Password is required",
    }),
});
// update
export const updateSchema = Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().trim().email().required().messages({
        // trim itu untuk menghapus spasi yg berlebih.
        "string.empty" : "Email cannot be empty",
        "string.email" : "The email format must be an email address",
        "string.required" : "Email is required",
    }),
    password: Joi.string().min(8).optional().messages({
        "string.min" : "Minimum password length is 8 characters",
    }),
})