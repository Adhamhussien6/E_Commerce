import joi from "joi";
import { genralrules } from "../../utils/generalRules/index.js";

export const addBrandSchema=joi.object({
    name:joi.string().required(),
    file:genralrules.file.required(),
    category:genralrules.id.required(),
    subcategory:genralrules.id.required()
})

export const getBrandByIdSchema=joi.object({
    brandId:genralrules.id.required()
})

export const updateBrandSchema = joi.object({
    brandId:genralrules.id.required(),
    file:genralrules.file.required(),
    name: joi.string().min(2).max(50).optional(),

    categoryId: genralrules.id.optional(),

    subcategoryId: joi.when("categoryId", {
        is: joi.exist(),
        then: genralrules.id.required(),
        otherwise: genralrules.id.optional(),
    })
});

export const softdeletebrandschema=joi.object({
    brandId:genralrules.id.required()
})

export const addbrandlogoschema=joi.object({
    file:genralrules.file.required(),
    brandId:genralrules.id.required()
})

export const getAllBrandSchema = joi.object({
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

  export const softDeleteManyBrandSchema = joi.object({
      ids:joi.array().items(genralrules.id).required()
  })
  