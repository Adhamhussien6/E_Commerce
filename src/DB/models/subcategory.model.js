import mongoose from "mongoose";
import slugify from "slugify";
import categorymodel from "./category.model.js";





const subcategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 2,
        maxlength: 50
    },
    image: {
        secure_url: String,
        public_id: String
      
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null
    },
    slug:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
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
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true
    },
      brand: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "brand",
           
        }],
        
    
        
    
    

   
}, {
    timestamps: true,
   
})

subcategorySchema.pre('save', function(next) {
    if (this.isModified('name')) {
      
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

  


const subcategorymodel = mongoose.model.subcategory || mongoose.model("subcategory", subcategorySchema)

export default subcategorymodel;