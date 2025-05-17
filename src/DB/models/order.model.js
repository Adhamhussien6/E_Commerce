import mongoose from "mongoose";
import { orderStatus, paymentMethodType } from "../../middleware/ENum.js";






const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cart',
        required: true,
      },
    items: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
        }
      ],
    totalPrice: {
        type: Number,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: Object.values(paymentMethodType),
        default: paymentMethodType.cash
    },
    status: {
        type: String,
        enum: Object.values(orderStatus),
        default: orderStatus.pending

    },
    paymentIntentId: {
        type: String,
       
    },
    paidAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    deliveredBy: {
         type: mongoose.Schema.Types.ObjectId, ref: "user"
    },
    cancelledAt: {
        type: Date
    },
    cancelledBy: {
         type: mongoose.Schema.Types.ObjectId, ref: "user"
    },
    refundedAt: {
        type: Date
    },
    refundedBy: {
         type: mongoose.Schema.Types.ObjectId, ref: "user"
    },


}, {
    timestamps: true,

})







const ordermodel = mongoose.model.order || mongoose.model("order", orderSchema)

export default ordermodel;