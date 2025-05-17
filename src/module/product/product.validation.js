import joi from "joi";
import { genralrules } from "../../utils/generalRules/index.js";
import { productStatus } from "../../middleware/ENum.js";

export const addproductSchema = joi.object({
  name: joi.string().min(2).max(100).required(),
  description: joi.string().min(10).required(),
  price: joi.number().positive().required(),
  discount: joi.number().min(0).max(100).default(0),
  quantity: joi.number().integer().min(0).required(),
  stock: joi.number().integer().min(0).required(),
  category: genralrules.id.required(),
  subcategory:  genralrules.id.required(),
  brand:genralrules.id.required(),
  files: joi.object({
    image: joi.array().items(joi.object({
        fieldname: joi.string().required(),
        originalname: joi.string().required(),
        encoding: joi.string().required(),
        mimetype: joi.string().valid('image/jpeg', 'image/png', 'image/gif').required(),
        path: joi.string().uri().required(),
        size: joi.number().positive().required(),
        filename: joi.string().required()
    })),
    images: joi.array().items(joi.object({
        fieldname: joi.string().required(),
        originalname: joi.string().required(),
        encoding: joi.string().required(),
        mimetype: joi.string().valid('image/jpeg', 'image/png', 'image/gif').required(),
        path: joi.string().uri().required(),
        size: joi.number().positive().required(),
        filename: joi.string().required()
    }))
}).optional() 
});

export const approveProductSchema = joi.object({
  id: genralrules.id.required(),
});

export const updateProductSchema = joi.object({
    name: joi.string().min(2).max(100),
    description: joi.string().min(5).max(1000),
    price: joi.number().positive(),
    discount: joi.number().min(0).max(100),
    quantity: joi.number().integer().min(0),
    stock: joi.number().integer().min(0)
  });

  export const getAllPendingUpdatesSchema = joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    search: joi.string().allow("").optional()
  });

  export const getAllProductForVendorSchema = joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    search: joi.string().allow("").optional(),
    status: joi.string().valid(productStatus).optional(),
    vendorId: genralrules.id.required(),
  });