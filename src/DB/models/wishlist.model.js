import mongoose from "mongoose";


const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
      },
      name: {
        type: String,
        default: 'My Wishlist',
        unique: true,
      },
      products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
      }]

}, {
    timestamps: true,

})

const wishlistmodel = mongoose.model.wishlist || mongoose.model("wishlist", wishlistSchema)

export default wishlistmodel;