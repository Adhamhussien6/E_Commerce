import joi from 'joi';
import { genralrules } from '../../utils/generalRules/index.js';
import { enumGender, userRole } from '../../middleware/ENum.js';

// export const signUpSchema = joi.object({
//     firstName: joi.string().min(3).max(20).required(),
//     lastName: joi.string().min(3).max(20).required(),
//    email:genralrules.email.required(),
//     password: joi.string().min(8).max(20).required(),
//     cPassword: genralrules.password.valid(joi.ref("password")).required(),
//     phone: joi.string().required(),
//     gender: joi.string().valid(enumGender.female,enumGender.male).required(),
//     DOB: joi.date().required(),

//     role: joi.forbidden(),
//      file:genralrules.file,
//      address:joi.string().required(),
//      storeName: joi.string().when("wantsToBeVendor", {
//         is: true, 
//         then: joi.string().min(3).max(50).required(), 
//         otherwise: joi.forbidden().messages({
//             "any.unknown": "You can't provide a store name unless you want to be a vendor."
//           })
//     }),
//     wantsToBeVendor: joi.boolean().required()

// }).with("storeName", "wantsToBeVendor");

export const signUpSchema = joi.object({
    firstName: joi.string().min(3).max(20).required(),
    lastName: joi.string().min(3).max(20).required(),
    email: genralrules.email.required(),
    password: joi.string().min(8).max(20).required(),
    cPassword: genralrules.password.valid(joi.ref("password")).required(),
    phone: joi.string().required(),
    gender: joi.string().valid(enumGender.female, enumGender.male).required(),
    DOB: joi.date().required(),
    address: joi.string().required(),
    file: genralrules.file,
  
    role: joi.forbidden(),
  
    wantsToBeVendor: joi.boolean(),
    storeName: joi.string().min(3).max(50)
  
  })
  .custom((value, helpers) => {
    // نفترض إن الـ admin بيتحدد في backend بناءً على شرط معين (مثلاً req.isAdmin)
    const isAdmin = value.email==="adhamh666@gmail.com"; // أو أي شرط آخر عندك
  
    if (isAdmin) {
      if (value.wantsToBeVendor !== undefined) {
        return helpers.error("any.invalid", { message: "Admin can't request to be vendor" });
      }
      if (value.storeName !== undefined) {
        return helpers.error("any.invalid", { message: "Admin can't have a storeName" });
      }
    } else {
      if (value.wantsToBeVendor === undefined) {
        return helpers.error("any.required", { message: "wantsToBeVendor is required" });
      }
  
      if (value.wantsToBeVendor === true && !value.storeName) {
        return helpers.error("any.required", { message: "storeName is required if wantsToBeVendor is true" });
      }
    }
  
    return value;
  });
  

export const confirmEmailSchema = joi.object({
    email: genralrules.email.required(),
    otp:joi.string().length(4).required(),
})

export const loginSchema = joi.object({
    email: genralrules.email.required(),
    password: genralrules.password.required(),
})


export const resetPasswordSchema = joi.object({
    email: genralrules.email.required(),
    password: genralrules.password.required(),
    cPassword: genralrules.password.valid(joi.ref("password")).required(),
    otp:joi.string().length(4).required(),
})

export const forgotPasswordSchema = joi.object({
    email: genralrules.email.required(),
   
})

export const getLoginInfoSchema = joi.object({
    headers: joi.object({
        authorization: joi.string().required()
    }).unknown(true),
    userId:genralrules.id
    
});

export const changePasswordSchema = joi.object({
    headers: joi.object({
        authorization: joi.string().required()
    }).unknown(true),
    userId:genralrules.id,
    oldPassword: genralrules.password.required(),
    newPassword: genralrules.password.required(),
    cPassword: genralrules.password.valid(joi.ref("newPassword")).required(),
})

export const updateProfileSchema = joi.object({
    firstName:joi.string().alphanum().min(3).max(50),
    lastName:joi.string().alphanum().min(3).max(50),
    
    gender: joi.string().valid(enumGender.female, enumGender.male),
    
    phone: joi.string(),
    //from chatgpt
    DOB: joi.date()
    .max(new Date(new Date().setFullYear(new Date().getFullYear() - 18))) 
    .messages({
      "date.max": "You must be at least 18 years old",
    }),
  
  address: joi.string().min(3).max(1000),


}).required()



export const updateProfilePictureSchema = joi.object({
    body: joi.object({
        file: genralrules.file.required()
     }).unknown(true)


}).required()


export const deletePictureSchema = joi.object({
    headers: joi.object({
        authorization: joi.string().required()
    }).unknown(true)  
}).required()


export const softDeleteSchema = joi.object({
    headers: joi.object({
        authorization: joi.string().required()
    }).unknown(true),
    userId:genralrules.id.required(),
}).required()

export const changeToAdminSchema=joi.object({
    userId:genralrules.id.required(),
    
})