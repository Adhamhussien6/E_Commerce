import usermodel from "../../DB/models/user.model.js";
import { userRole } from "../../middleware/ENum.js";
import cloudinary from "../../utils/cloudinary/index.js";
import { pagination } from "../../utils/feature/pagination.js";
import { generateEmailSuggestions } from "../../utils/generateEmailSuggestions/index.js"
import { asynchandler } from "../../utils/globalErrorHandling/index.js";
import { compare } from "../../utils/Hash/compare.js";
import { Hash } from "../../utils/Hash/hash.js";
import { eventEmitter } from "../../utils/sendEmail.events/index.js";
import { generatetoken } from "../../utils/token/generateToken.js";



export const signUp = asynchandler(async (req, res, next) => {
    const { firstName, lastName, email, password, gender, DOB, phone, address, wantsToBeVendor, storeName } = req.body;
   
   const emailExist = await usermodel.findOne({ email })
    if (emailExist) {
        const suggestions = await generateEmailSuggestions(email);
        return res.status(400).json({
            message: "Email already exists",
            suggestions
        })
    }
    let Role = userRole.user;
    let newStoreName = null;
    const isVendor = wantsToBeVendor === true || wantsToBeVendor === "true"


    if (email === process.env.ADMIN_EMAIL) {
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(403).json({ message: "Invalid Admin password." });
        }
        Role = userRole.admin;
        
    }
    else if (isVendor) {
    
        if (!storeName) {
            return res.status(400).json({ message: "Store name is required to become a vendor." });
        }
        newStoreName = storeName;
        Role = userRole.user;

    } 
   

    let profilePicture = null;
    if (req.file) {
        const uploadProfilePicture = await cloudinary.uploader.upload(req.file.path, {
            folder: "ecommerce_express/user",

        });
        profilePicture = { secure_url: uploadProfilePicture.secure_url, public_id: uploadProfilePicture.public_id };
    }

    const user = await usermodel.create({
        firstName,
        lastName,
        email,
        password,
        gender,
        DOB,
        role: Role,
        phone,
        address,
        profilePicture,
        storeName: newStoreName,
        wantsToBeVendor,



    })
    if (Role === userRole.admin) {
        
        user.isConfirmed = true;
        await user.save(); 
    } else {
        
        eventEmitter.emit("confirmEmail", {
            email,
            id: user._id,
        });
    }


    return res.status(201).json({
        message: "User created successfully",
        data: user,
    })


})

export const confirmEmail = asynchandler(async (req, res, next) => {
    const { email, otp } = req.body
    const user = await usermodel.findOne({ email },{isConfirmed:false})
    if (!user) {
        return res.status(400).json({
            message: "user not found or already confirmed",
        })
    }
    const otpFinder = user.Otp?.find(finder => finder.type === "confirmation")
    if (!otpFinder) {
        return next(new Error("otp not found", { cause: 400 }))
    }

    const isMatch = await compare({ key: otp, hashed: otpFinder.code })
    if (!isMatch) {
        return next(new Error("otp not match", { cause: 400 }))
    }

    
    await usermodel.updateOne(
        { email },
        { isConfirmed: true, $pull: { Otp: { type: "confirmation" } } },
        { new: true }
    );


    return res.status(200).json({ message: "email confirmed successfully", user })


})

export const login = asynchandler(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await usermodel.findOne({ email, isdeleted: false, isConfirmed: true })
    if (!user) {
        return next(new Error("user not found", { cause: 400 }))
    }

    const isPasswordMatch = await compare({ key: password, hashed: user.password })
    if (!isPasswordMatch) {
        return next(new Error("password not match", { cause: 400 }))
    }
    if (user.isbanned && user.bannedUntil) {
        const now = new Date();
        if (now >= user.bannedUntil) {
           
            await usermodel.findByIdAndUpdate(user._id, {
                isbanned: false,
                bannedAt: null,
                bannedUntil: null,
            });
            user.isbanned = false;  
        } else {
            return res.status(403).json({
                message: `You are banned until ${user.bannedUntil.toISOString()}`,
            });
        }
    }
    const access_token = await generatetoken({
        payload: { id: user._id, email },
        SIGNATURE: user.role == userRole.user || userRole.vendor ? process.env.ACCESS_SIGNATURE_USER : process.env.ACCESS_SIGNATURE_ADMIN,
        option: { expiresIn: "1w" }
    })
    const refresh_token = await generatetoken({
        payload: { id: user._id, email },
        SIGNATURE: user.role == userRole.user || userRole.vendor ? process.env.REFRESH_SIGNATURE_USER : process.env.REFRESH_SIGNATURE_ADMIN,
        option: { expiresIn: "1y" }
    })

    return res.status(200).json({
        message: "login successfully",
        access_token,
        refresh_token,
    })
})

export const forgotPassword = asynchandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await usermodel.findOne({ email, isdeleted: false, isConfirmed: true, isbanned: false })
    if (!user) {
        return next(new Error("user not found", { cause: 400 }))
    }
    eventEmitter.emit("forgotPassword", {
        email,
        id: user._id,
    });
    return res.status(200).json({
        message: "please check your email",
    })
})

export const resetPassword = asynchandler(async (req, res, next) => {
    const { email, otp, password } = req.body;
    const user = await usermodel.findOne({ email, isdeleted: false, isConfirmed: true })
    if (!user) {
        return next(new Error("user not found", { cause: 400 }))
    }
    const otpFinder = user.Otp?.find(finder => finder.type === "forgotPassword")
    if (!otpFinder) {
        return next(new Error("otp not found", { cause: 400 }))
    }
    const isMatch = await compare({ key: otp, hashed: otpFinder.code })
    if (!isMatch) {
        return next(new Error("otp not match", { cause: 400 }))
    }
    const hashedPassword = await Hash({ key: password, SALT_ROUNDs: process.env.SALT_ROUND })
    await usermodel.updateOne(
        { email },
        { password: hashedPassword, $pull: { Otp: { type: "forgotPassword" } }, changeCredentialsTime: Date.now() },
        { new: true }
    );
    return res.status(200).json({
        message: "password reset successfully",
    })

})

export const getProfile = asynchandler(async (req, res, next) => {
    const user = await usermodel.findOne({ _id: req.user._id, isdeleted: false })
    if (!user) {
        return next(new Error("user not found", { cause: 400 }))
    }

    return res.status(200).json({
        message: "user profile",
        data: user,
    })
})

export const changePassword = asynchandler(async (req, res, next) => {

    const { oldPassword, newPassword } = req.body;
    const user = await usermodel.findOne({ _id: req.user._id })
    if (!user) {
        return next(new Error("user not found", { cause: 400 }))
    }
    const isMatch = await compare({ key: oldPassword, hashed: user.password })
    if (!isMatch) {
        return next(new Error("old password not match", { cause: 400 }))
    }
    const hashedPassword = await Hash({ key: newPassword, SALT_ROUNDs: process.env.SALT_ROUND })
    await usermodel.updateOne(
        { _id: req.user._id },
        { password: hashedPassword , changeCredentialsTime: Date.now()},
        { new: true }
    );
    return res.status(200).json({
        message: "password changed successfully",
    })
})

export const updateProfile = asynchandler(async (req, res, next) => {
    if (req.body.phone) {
        req.body.phone = await encrypt({
            key: req.body.phone,
            SECRET_KEY: process.env.SECRET_KEY,
        });
    }

   const user = await usermodel.findByIdAndUpdate(req.user._id, req.body, {
    new: true, // يرجع المستند بعد التحديث
});
    return res
        .status(200)
        .json({ message: "Profile updated successfully", user });
});

export const updateProfilePicture = asynchandler(async (req, res, next) => {
    if (!req.file) {
        return next(new Error("please upload a file", { cause: 400 }));
    }


    const user = await usermodel.findById(req.user._id);
    if (!user) {
        return next(new Error("user not found", { cause: 404 }));
    }


    if (user.profilePicture?.public_id) {
        await cloudinary.uploader.destroy(user.profilePicture.public_id);
    }


    const uploadProfilePicture = await cloudinary.uploader.upload(req.file.path, {
        folder: "ecommerce_express/user",
    });


    const updatedUser = await usermodel.findByIdAndUpdate(
        req.user._id,
        {
            profilePicture: {
                secure_url: uploadProfilePicture.secure_url,
                public_id: uploadProfilePicture.public_id
            }
        },
        { new: true }
    ).select("-password -Otp");

    return res.status(200).json({
        message: "Profile picture updated successfully",
        user: updatedUser
    });
});

export const deleteProfilePic = asynchandler(async (req, res, next) => {
    const user = await usermodel.findById(req.user.id);
    if (!user) {
        return next(new Error("User not found", { cause: 404 }));
    }
    if (user.profilePicture && user.profilePicture.public_id) {
        await cloudinary.uploader.destroy(user.profilePicture.public_id);
    } else {
        return res.status(200).json({ message: "No profile picture to delete" });
    }
    const updatedUser = await usermodel.findByIdAndUpdate(
        req.user.id,
        { profilePicture: null },
        { new: true }
    );
    if (!updatedUser) {
        return next(new Error("User not found", { cause: 404 }));
    }
    return res.status(200).json({ message: "Profile picture deleted successfully", updatedUser });
})

export const deleteUser = asynchandler(async (req, res, next) => {
    const { userId } = req.params
    const user = await usermodel.findById(userId);
    if (!user) {
        return next(new Error("user not found", { cause: 404 }))
    }
    if (user.role == "admin") {
        return next(new Error("you can not delete admin", { cause: 400 }))
    }
    if (user.profilePicture && user.profilePicture.public_id) {
        await cloudinary.uploader.destroy(user.profilePicture.public_id);
    }
    await user.deleteOne()

    return res.status(200).json({
        message: "user deleted successfully",
        user,
    })
})

export const banUser = asynchandler(async (req, res, next) => {
    const { userId } = req.params
    const user = await usermodel.findOne({ _id: userId }, { isdeleted: false, isbanned: false })
    if (!user) {
        return next(new Error("user not found or already banned", { cause: 404 }))
    }

    if (user.role == "admin") {
        return next(new Error("you can not ban admin", { cause: 400 }))
    }
    const now =new Date()
    const bannedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    

    await usermodel.updateOne({ _id: userId }, { bannedBy: req.user.id,isbanned: true, bannedAt: now,bannedUntil: bannedUntil })
    const updatedUser = await usermodel.findById(userId).select("-password -Otp");

    return res.status(200).json({
        message: "user banned successfully",
        user: updatedUser
    });

})

export const unbanUser = asynchandler(async (req, res, next) => {
    const { userId } = req.params;

    const user = await usermodel.findOne({ _id: userId, isdeleted: false, isbanned: true });
    if (!user) {
        return next(new Error("user not found or not banned", { cause: 404 }));
    }

    const updatedUser = await usermodel.findByIdAndUpdate(
        userId,
        {bannedBy: null, isbanned: false, bannedAt: null,bannedUntil: null },
        { new: true }
    ).select("-password -Otp");

    return res.status(200).json({
        message: "User unbanned successfully",
        user: updatedUser,
    });
});

export const getUserData = asynchandler(async (req, res, next) => {
    const { userId } = req.params
    const user = await usermodel.findOne({ _id: userId, isdeleted: false, isbanned: false }).select("-password -Otp")
    if (!user) {
        return next(new Error("user not found", { cause: 404 }))
    }

    return res.status(200).json({
        message: "user data",
        data: user,
    })
})

export const ApproveVendor = asynchandler(async (req, res, next) => {
    const { userId } = req.params;


    const user = await usermodel.findOne({
        _id: userId,
        isConfirmed: true,
        isdeleted: false,
        isbanned: false,
        role: userRole.user,
        isApprovedAsVendor: false,
        wantsToBeVendor:true
    });

    if (!user) {
        return next(new Error("User not found or already approved as vendor", { cause: 404 }));
    }


    

  const updatedUser=  await usermodel.updateOne({ _id: userId }, { isApprovedAsVendor: true,isApprovedAsVendorBy:req.user._id ,role:userRole.vendor, isApprovedAsVendorAt: new Date() }, { new: true });

    return res.status(200).json({
        message: "User approved as vendor successfully",
        updatedUser,
    });
});

export const changeToAdmin=asynchandler(async(req,res,next)=>{
    const {userId}=req.params
    const user=await usermodel.findOne({_id:userId,isbanned:false,isConfirmed:true,isdeleted:false})
    if(!user){
        return next(new Error("user not found", {cause:404}))
    }
    if(user.role===userRole.admin){

        return res.status(200).json({
            message:"user already admin"
        })
    }
    await usermodel.updateOne({_id:userId},{$set:{role:userRole.admin},beAdminBy:req.user._id}, {new:true})
    return res.status(200).json({message:"user changed to admin"})
    
})

export const getAllUsers=asynchandler(async(req,res,next)=>{
    const { page, limit, search } = req.query;

    const filter = search ? { firstName: { $regex: search, $options: "i" } } : {};

    const result = await pagination({
        model: usermodel,
        page,
        limit,
        filter,
        sort: { createdAt: 1 },
      });


    return res.status(200).json({
        message: "All users fetched successfully",
        data: result
    });
})

export const getAllDeletedUsers=asynchandler(async(req,res,next)=>{
    const { page, limit, search } = req.query;

    const filter = search ? { firstName: { $regex: search, $options: "i" },isdeleted:true } : {isdeleted:true};


    const result = await pagination({
        model: usermodel,
        page,
        limit,
        filter,
        sort: { createdAt: 1 },
      });


    return res.status(200).json({
        message: "All deleted users fetched successfully",
        data: result
    });
})

export const getAllBanneddUsers=asynchandler(async(req,res,next)=>{
    const { page, limit, search } = req.query;

    const filter = search ? { firstName: { $regex: search, $options: "i" },isbanned:true } : {isbanned:true};


    const result = await pagination({
        model: usermodel,
        page,
        limit,
        filter,
        sort: { createdAt: 1 },
      });


    return res.status(200).json({
        message: "All banned users fetched successfully",
        data: result
    });
})

export const getAllVendorsrequests=asynchandler(async(req,res,next)=>{
    const { page, limit, search } = req.query;

    const filter = search ? { firstName: { $regex: search, $options: "i" },isApprovedAsVendor:false,wantsToBeVendor:true } : {isApprovedAsVendor:false,wantsToBeVendor:true};



    const result = await pagination({
        model: usermodel,
        page,
        limit,
        filter,
        sort: { createdAt: 1 },
})
return res.status(200).json({
    message: "All requests fetched successfully",
    data: result
});

})

export const getAllVendors=asynchandler(async(req,res,next)=>{
    const { page, limit, search } = req.query;

    const filter = search ? { firstName: { $regex: search, $options: "i" },isApprovedAsVendor:true,wantsToBeVendor:true } : {isApprovedAsVendor:true,wantsToBeVendor:true};



    const result = await pagination({
        model: usermodel,
        page,
        limit,
        filter,
        sort: { createdAt: 1 },
})
return res.status(200).json({
    message: "All vendors fetched successfully",
    data: result
});

})

export const searchStoreByName=asynchandler(async(req,res,next)=>{
    const { page, limit, search } = req.query;
    const filter = search ? { storeName: { $regex: search, $options: "i" },isApprovedAsVendor:true,wantsToBeVendor:true } : {isApprovedAsVendor:true,wantsToBeVendor:true};
    const result = await pagination({
        model: usermodel,
        page,
        limit,
        filter,
        sort: { createdAt: 1 },
})
return res.status(200).json({
    message: "All vendors fetched successfully",
    data: result
});
})

