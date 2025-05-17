import mongoose from "mongoose";
import slugify from "slugify";





const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true
      },
      items: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
          },
          quantity: {
            type: Number,
            default: 1,
            min: 1
          },
          price:{
            type: Number,
            required: true
          }
        }
      ],
      totalPrice: {
        type: Number,
        default: 0
      }

}, {
    timestamps: true,

})








const cartmodel = mongoose.model.cart || mongoose.model("cart", cartSchema)

export default cartmodel;