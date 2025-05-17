import joi from "joi";
import { genralrules } from "../../utils/generalRules/index.js";

export const addProductToWishlistValidation = joi.object({
  productId: genralrules.id.required(),
  wishlistName: joi.string().min(2).max(50).optional(),
});

export const updateWishlistNameSchema = joi.object({
  
    oldName: joi.string().required(),
    newName: joi.string().required(),
});

export const removeProductSchema = joi.object({
  
    productId: genralrules.id.required(),
    wishlistName: joi.string().required(),
});
export const deleteWishlistSchema = joi.object({
  
  
    wishlistName: joi.string().required()
});

export const getMyWishlistSchema = joi.object({
    name: joi.string().min(2).max(50).optional(),
    page: joi.number().integer().min(1).optional(),
    limit: joi.number().integer().min(1).optional()
  });

export const emptyWishlistSchema = joi.object({
    name: joi.string().min(2).max(50).optional(),
  
  });

  export const moveProductSchema = joi.object({
  
    productId: genralrules.id.required(),
    from: joi.string().required(),
    to: joi.string().required(),
    
});