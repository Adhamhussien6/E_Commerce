import joi from 'joi';
import { genralrules } from '../../utils/generalRules/index.js';

export const addCouponSchema = joi.object({
  code: joi.string().alphanum().min(3).max(30).required(),
  discountType: joi.string().valid('percentage', 'fixed').required(),
  discountValue: joi.number()
  .when('discountType', {
    is: 'percentage',
    then: joi.number().min(0).max(100).required(), 
    otherwise: joi.number().min(1).required()       
  }),
  minOrderValue: joi.number().min(1).required(),
  usageLimit: joi.number().min(1).required(),
  expiresAt: joi.date().greater('now').required(),
  storeNames: joi.array().items(joi.string().required()).optional(),
 
});

  export const getCouponsSchema = joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    search: joi.string().allow("").optional()
  });

  export const getCouponsForVendorSchema = joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    search: joi.string().allow("").optional(),
    vendorId: genralrules.id.required()
  });

  export const getCouponByIdSchema = joi.object({
  
    id: genralrules.id.required()
  });

  export const updateCouponSchema = joi.object({
    code: joi.string().min(1),
    discountType: joi.string().valid("percentage", "fixed"), 
    discountValue: joi.number()
  .when('discountType', {
    is: 'percentage',
    then: joi.number().min(0).max(100).optional(), 
    otherwise: joi.number().min(1).optional()       
    }),
    storeNames: joi.array().items(joi.string()).optional(),
    minOrderValue: joi.number().min(1).optional(),
    usageLimit: joi.number().min(1).optional(),
    expiresAt: joi.date(),
    isActive: joi.boolean(),
    id:genralrules.id.required()
  });

  export const deleteCouponSchema = joi.object({
  
    couponId: genralrules.id.required()
  });
