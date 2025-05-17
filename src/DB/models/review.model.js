import mongoose from "mongoose";






const reviewSchema = new mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user"
  },
  product:{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "product"
  },
  rating: {
    type: Number,
   
    min: 1,
    max: 5,
    default: null
  },
  comment: {
    type: String,
    default: "",
    
   
  },
  date: {
    type: Date,
    default: Date.now
  }

}, {
    timestamps: true,

})







const reviewmodel = mongoose.model.review || mongoose.model("review", reviewSchema)

export default reviewmodel;