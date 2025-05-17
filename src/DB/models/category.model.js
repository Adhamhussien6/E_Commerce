import mongoose from "mongoose";
import slugify from "slugify";





const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
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
    subCategory:[
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subcategory",
        }
     ],
}, {
    timestamps: true,
   
})

categorySchema.pre('save', function(next) {
    if (this.isModified('name')) {
      
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

  

const categorymodel = mongoose.model.category || mongoose.model("category", categorySchema)

export default categorymodel;