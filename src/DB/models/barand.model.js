import mongoose from "mongoose";
import slugify from "slugify";





const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 2,
        maxlength: 50
    },

    logo: {
        secure_url: String,
        public_id: String


    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    updatedAt:{
        type: Date,
        default:null
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
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
    subcategory: {


        type: mongoose.Schema.Types.ObjectId,
        ref: "subcategory",
        required: true



    },

    category: {


        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true



    },
    logoDeletedAt:{
        type: Date,
        default: null
    },
    logoDeletedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null
    },
    product:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
       
    }]



}, {
    timestamps: true,

})

brandSchema.pre('save', function (next) {
    if (this.isModified('name')) {

        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});






const brandmodel = mongoose.model.brand || mongoose.model("brand", brandSchema)

export default brandmodel;