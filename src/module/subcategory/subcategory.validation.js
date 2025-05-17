import joi from "joi";
import { genralrules } from "../../utils/generalRules/index.js";

export const addSubCategorySchema = joi.object({
    name: joi.string().min(2).max(50).required(),
    
    file: genralrules.file.required(),
    category: genralrules.id.required()
})


export const updateSubCategorySchema = joi.object({
    name: joi.string().min(2).max(50),
    category: genralrules.id,
    id:genralrules.id.required()
}).or('name', 'category');


export const softDeleteSubCategorySchema = joi.object({
   
    id:genralrules.id.required()
})
export const addSubCategoryImageSchema = joi.object({
    file: genralrules.file.required(),
    id:genralrules.id.required()
})
export const searchSubCategorySchema = joi.object({
    
    name: joi.string().min(1).max(50),
    

})


export const softDeleteManySubCategorySchema = joi.object({
    ids:joi.array().items(genralrules.id).required()
})


export const getAllSubCategorySchema = joi.object({
    page: joi.number().integer().min(1).optional().messages({
      "number.base": "Page must be a number",
      "number.min": "Page must be at least 1"
    }),
    limit: joi.number().integer().min(1).optional().messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1"
    }),
    search: joi.string().optional().messages({
      "string.base": "Search must be a string"
    })
  });