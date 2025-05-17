import joi from 'joi';
import { genralrules } from '../../utils/generalRules/index.js';


export const addCategorySchema = joi.object({
    name: joi.string().min(2).max(50).required(),
    description: joi.string().min(1).max(40).required(),
  
     file:genralrules.file.required(),
   
})
export const updateCategorySchema = joi.object({
    name: joi.string().min(2).max(50),
    description: joi.string().min(1).max(40),
  
     file:genralrules.file,
     categoryId:genralrules.id
   
})
.required()

export const getAllCategorySchema = joi.object({
    page: joi.number().integer().min(1).messages({
      "number.base": "Page must be a number",
      "number.min": "Page must be at least 1"
    }),
    limit: joi.number().integer().min(1).max(100).messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit must be at most 100"
    }),
    
  });


  export const getCategoryByIdSchema = joi.object({
    id: genralrules.id.required()
  })

  export const searchCategorySchema = joi.object({
    name: joi.string().min(1),
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
  });
  