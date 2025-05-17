import mongoose from "mongoose";

import { discountType, userRole } from "../../middleware/ENum.js";





const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
       
      },
      discountType: {
         type:String,
         enum: Object.values(discountType),
         default: discountType.percentage
      },
      discountValue: {
        type: Number,
        required: true,
      },
      minOrderValue: {
        type: Number,
        default: 0,
      },
    
      usageLimit: {
        type: Number,
        default: 1, 
      },
      usageCount: {
        type: Number,
        default: 0,
      },
      products: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
      ], 
      expiresAt: {
        type: Date,
        required: true,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      storeName: {
        type: [String],
        required: function () {
          return this.role === userRole.vendor; 
        },
        default: null
      },
      usedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    }],
      role: {
        type: String,
        enum: [userRole.admin, userRole.vendor],
        required: true,
      },
      DeactivatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null
      }

}, {
    timestamps: true,

})




const couponmodel = mongoose.model.coupon || mongoose.model("coupon", couponSchema)

export default couponmodel;