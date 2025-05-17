import mongoose from "mongoose";
import slugify from "slugify";
import { productStatus } from "../../middleware/ENum.js";





const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        minlength: 2,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 40
    },
    slug: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    image: {
        secure_url: String,
        public_id: String

    },
    images: [{
        secure_url: String,
        public_id: String

    }],
    price: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        min: 0,
        max: 100,
        required: true

    },
    rateNum: {
        type: Number,
        min: 0,
        default: 0,


    },
    rateAvg: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,

    },
    subPrice: {
        type: Number,

    },
    quantity: {
        type: Number,
        required: true

    },
    stock: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true

    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subcategory",
        required: true
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "brand",
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null
    },
    deletedAt: {
        type: Date,
        default: null
    },
    isApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",

    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null
    },
    status: {
        type: String,
        enum: Object.values(productStatus),
        default: productStatus.pending,
    },
    storeName: {
        type: String,

    },
    pendingUpdate: {
        type: Object,
        default: null
    },
    hasPendingUpdate: {
        type: Boolean,
        default: false
    },
    review:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "review",
            default: null

        }
    ]
  


}, {
    timestamps: true,

})

productSchema.pre('save', function (next) {
    if (this.isModified('name')) {

        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});






const productmodel = mongoose.model.product || mongoose.model("product", productSchema)

export default productmodel;