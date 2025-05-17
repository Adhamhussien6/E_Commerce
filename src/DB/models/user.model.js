import mongoose from "mongoose";
import { codeType, enumGender, userRole } from "../../middleware/ENum.js";
import { Hash } from "../../utils/Hash/hash.js";
import { encrypt } from "../../utils/encrypt/encrypt.js";
import { decrypt } from "../../utils/encrypt/decrypt.js";




const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 20

    }, lastName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    },
    password: {
        type: String,
       
        minlength: 8,
        trim: true
       
    },
  
    gender: {
        type: String,
        enum: Object.values(enumGender),
        required: true 
    },
    DOB: {
        type: Date,
        required: true,
        validate: {
        validator: function(value) {
          const age = new Date().getFullYear() - value.getFullYear();
          return age > 18;
        },
        message: "User must be older than 18 years"
        }
    },
    phone: {
        type: String,
         required: true,

        
      
    },
    role: {
        type:String,
        enum: Object.values(userRole),
        default: userRole.user
    },
    address: {
        type: String,
        required: true,
        
    },
    isConfirmed: {
        type: Boolean,
        default: false
    },
    beAdminBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    deletedAt: {
        type: Date,
       
    },
    deletedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"

    },
    isdeleted: {
        type: Boolean,
        default: false
    },  
    bannedAt: {
        type: Date,
    },
    isbanned: {
        type: Boolean,
        default: false
    },
    bannedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    bannedUntil:{
        type: Date,
    },
    isApprovedAsVendor: {
        type: Boolean,
        default: false 
    },
    isApprovedAsVendorBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"

    },

    wantsToBeVendor:{
        type: Boolean,
        default: false 

    },
    storeName: {
        type: String,
        required: function() { return this.role === 'vendor'; }, 
        minlength: 3,
        maxlength: 100
    },

  
    profilePicture: {
        secure_url: String,
        public_id: String
    },
   
    Otp: [{
        code: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: Object.values(codeType),
            required: true
        },
        expiresAt: {
            type: Date,
            required: true
        }
        


    }],
    changeCredentialsTime:{
        type:Date,
        default: Date.now
    }
  


   
}, {
    timestamps: true,
   
   
})


userSchema.virtual("username").get(function() {
    return [this.firstName, this.lastName].join(" ");
});
  


userSchema.pre("save", async function (next, doc) {
   
    if (this.isModified("password")) {
        this.password=await Hash({key:this.password,SALT_ROUNDs:process.env.SALT_ROUND})

    }
    if (this.isModified("phone")) {
        this.phone = await encrypt({
          key: this.phone,
          SECRET_KEY: process.env.SECRET_KEY,
        });
      }
    
    
    next()
    
    

})




userSchema.post("findOne", async function (doc,next) {
    if (doc && doc.phone) {
        doc.phone = await decrypt({
            key: doc.phone,
            SECRET_KEY: process.env.SECRET_KEY,
        });
    }
});

// userSchema.virtual("isUserConfirmed").get(function() {
//     if (this.role !== userRole.admin) {
//         return this._isConfirmed;  
//     }
//     return undefined; 
// });

// userSchema.virtual("isUserConfirmedBy").get(function() {
//     if (this.role !== userRole.admin) {
//         return this._isConfirmedBy;  
//     }
//     return undefined; 
// });

userSchema.set("toJSON", { virtuals: true }),
userSchema.set("toObject", { virtuals: true })


  

const usermodel = mongoose.model.user || mongoose.model("user", userSchema)

export default usermodel;