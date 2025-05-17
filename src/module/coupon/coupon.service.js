import couponmodel from "../../DB/models/coupon.model.js";
import usermodel from "../../DB/models/user.model.js";
import { userRole } from "../../middleware/ENum.js";
import { pagination } from "../../utils/feature/pagination.js";
import { asynchandler } from "../../utils/globalErrorHandling/index.js";



export const addCoupon = asynchandler(async (req, res, next) => {
  const { code, discountType, discountValue, minOrderValue, usageLimit, expiresAt, storeNames } = req.body
  const role = req.user.role;
  const createdBy = req.user._id

  let finalStoreNames = [];

  if (role === userRole.vendor) {

    if (!req.user.storeName) {
      return res.status(400).json({ message: "Store name not found in vendor profile" });
    }
    finalStoreNames = [req.user.storeName];
  } else if (role === userRole.admin) {

    if (storeNames && storeNames.length > 0) {
        const storesExist = await usermodel.find({
        storeName: { $in: storeNames },
        role: userRole.vendor,
      });

      const existingStoreNames = storesExist.map(store => store.storeName);
      const notFound = storeNames.filter(s => !existingStoreNames.includes(s));

      if (notFound.length > 0) {
        return res.status(400).json({ message: `Invalid store names: ${notFound.join(", ")}` });
      }

      finalStoreNames = storeNames;

    } else {
      finalStoreNames = [];
    }
  } else {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const newCoupon = {
    code,
    discountType,
    discountValue,
    minOrderValue,
    expiresAt,
    usageLimit,
    storeName: finalStoreNames,
    createdBy,
    role
  };


  const coupon = await couponmodel.create(newCoupon);


  return res.status(201).json({
    message: "Coupon created successfully",
    coupon,
  });

})

export const getCoupons = asynchandler(async (req, res) => {
  const { page, limit, search } = req.query;

  const filter = search
    ? {
      $or: [
        { code: { $regex: search, $options: "i" } },
        { discountType: { $regex: search, $options: "i" } },
        { storeNames: { $regex: search, $options: "i" } },
      ],
    }
    : {};

  const result = await pagination({
    model: couponmodel,
    page,
    limit,
    filter,
    select: "code discountType discountValue storeNames expiresAt isActive",
    sort: { createdAt: 1 },
  })
  if (!result.data || result.data.length === 0) {
    return res.status(404).json({
      message: search
        ? "No matching coupon for your search"
        : "There are no coupons found",

    });
  }

  return res.status(200).json({
    message: "All coupons fetched successfully",
    data: result
  })
})

export const getAllCouponsForVendor = asynchandler(async (req, res) => {
   const { page, limit, search } = req.query;
    const { vendorId } = req.params;
  
   
    const vendor = await usermodel.findOne({
      _id: vendorId,
      role: userRole.vendor,
      isdeleted: false,
      isApprovedAsVendor: true,
      isConfirmed: true,
      isbanned: false,
    });
  
    if (!vendor) {
      return res.status(400).json({ message: "Vendor not found" });
    }
  
    const filter = search
    ? {
      $or: [
        { code: { $regex: search, $options: "i" } },
        { discountType: { $regex: search, $options: "i" } },
        { storeNames: { $regex: search, $options: "i" } },
      ],
      createdBy: vendorId,
      
    }
    
    : { createdBy: vendorId};
  
    
  
    const result = await pagination({
      model: couponmodel,
      page,
      limit,
      filter,
      select: "code discountType discountValue storeNames expiresAt isActive",
      sort: { createdAt: -1 },
    });
  
    if (!result.data || result.data.length === 0) {
      return res.status(404).json({
        message: search
          ? "No matching coupons found for your search"
          : "There are no coupons",
       
      });
    }
  
    return res.status(200).json({
      message: "Vendor coupons fetched successfully",
      result,
  
    });

})

export const getMyCoupons=asynchandler(async (req, res, next) => {
  const { page, limit, search } = req.query;
  const  Id  = req.user._id;

 
  const user = await usermodel.findOne({
    _id: Id,
    role: [userRole.vendor, userRole.admin],
    isdeleted: false,
    isConfirmed: true,
    isbanned: false,
  });

  if (!user) {
    return res.status(400).json({ message: "user not found" });
  }

  const filter = search
  ? {
    $or: [
      { code: { $regex: search, $options: "i" } },
      { discountType: { $regex: search, $options: "i" } },
      { storeNames: { $regex: search, $options: "i" } },
    ],
    createdBy: Id,
    
  }
  
  : { createdBy: Id};

  

  const result = await pagination({
    model: couponmodel,
    page,
    limit,
    filter,
    select: "code discountType discountValue storeNames expiresAt isActive",
    sort: { createdAt: -1 },
  });

  if (!result.data || result.data.length === 0) {
    return res.status(404).json({
      message: search
        ? "No matching coupons found for your search"
        : "There are no coupons",
     
    });
  }

  return res.status(200).json({
    message: "coupons fetched successfully",
    result,

  });

})

export const getCouponById=asynchandler(async(req,res,next)=>{
  const {id}=req.params;
  const filter={_id:id}
  const result=await pagination({
    model:couponmodel,
    page:1,
    limit:1,
    filter:filter,
    select:"code discountType discountValue storeNames expiresAt isActive",
    sort:{createdAt:-1}
  })
  if(!result.data||result.data.length===0){
    return res.status(404).json({
      message:"No matching coupons found for your search",
    })
  }
  return res.status(200).json({
    message: "Coupon fetched successfully",
    data: result.data[0],
  });
})

export const updateCoupon=asynchandler(async(req,res,next)=>{
  const {id}=req.params;
  const {code,discountType,discountValue,storeNames,expiresAt,isActive,minOrderValue,usageLimit}=req.body;
 
  const coupon = await couponmodel.findById(id);
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }
  if (coupon.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized to update this coupon" });
  }
  if (req.user.role === "vendor" && storeNames !== undefined) {
    return res.status(403).json({ message: "Vendors are not allowed to update storeName" });
  }

  if (discountType !== undefined && discountType === "percentage" && coupon.discountType === "fixed") {
    if (discountValue === undefined) {
      return res.status(400).json({ message: "You must provide discountValue when changing type to percentage" });
    }
    if (discountValue < 1 || discountValue > 100) {
      return res.status(400).json({ message: "discountValue for percentage must be between 1 and 100" });
    }
  }
  if (discountType !== undefined && discountType === "fixed" && coupon.discountType === "percentage") {
    if (discountValue === undefined) {
      return res.status(400).json({ message: "You must provide discountValue when changing type to fixed" });
    }
    if (discountValue <= 0) {
      return res.status(400).json({ message: "discountValue for fixed must be greater than 0" });
    }
  }

  if (expiresAt !== undefined && isNaN(Date.parse(expiresAt))) {
    return res.status(400).json({ message: "expiresAt must be a valid date" });
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    return res.status(400).json({ message: "isActive must be true or false" });
  }
  if (minOrderValue !== undefined && isNaN(minOrderValue)) {
    return res.status(400).json({ message: "minOrderValue must be a number" });
  }

  if (usageLimit !== undefined && isNaN(usageLimit)) {
    return res.status(400).json({ message: "usageLimit must be a number" });
  }
  if (req.user.role === "admin" && storeNames !== undefined) {
    const storesExist = await usermodel.find({
      storeName: { $in: Array.isArray(storeNames) ? storeNames : [storeNames] },
      role: userRole.vendor,
    });

    const existingStoreNames = storesExist.map(store => store.storeName); 
    const notFoundStores = storeNames.filter(store => !existingStoreNames.includes(store)); 

    if (notFoundStores.length > 0) {
      return res.status(404).json({
        message: `The following store names do not exist: ${notFoundStores.join(", ")}`,
      });
    }

    coupon.storeName = storeNames;
}

  if (code !== undefined) coupon.code = code;
  if (discountType !== undefined) coupon.discountType = discountType;
  if (discountValue !== undefined) coupon.discountValue = discountValue;
  if (expiresAt !== undefined) coupon.expiresAt = new Date(expiresAt);
  if (isActive !== undefined) coupon.isActive = isActive;
  if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
  if (usageLimit !== undefined) coupon.usageLimit = usageLimit;

  await coupon.save();

  return res.status(200).json({
    message: "Coupon updated successfully",
    data: coupon,
  });

 
})

export const deleteCoupon = asynchandler(async (req, res, next) => {
  const { couponId } = req.params;
  const { role, _id: userId } = req.user;

  const coupon = await couponmodel.findById(couponId);
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }

 
  if (role === userRole.admin) {
    await coupon.deleteOne();
    return res.status(200).json({ message: "Coupon deleted successfully by admin" });
  }


  if (role === userRole.vendor) {
    if (coupon.createdBy.toString() === userId.toString()) {
      await coupon.deleteOne();
      return res.status(200).json({ message: "Coupon deleted successfully by vendor" });
    } else {
      return res.status(403).json({ message: "You are not authorized to delete this coupon" });
    }
  }

 
  return res.status(403).json({ message: "You are not authorized to perform this action" });
});

export const deActivateCoupon = asynchandler(async (req, res, next) => {
  const { couponId } = req.params;
  const { role, _id: userId } = req.user;
  const coupon = await couponmodel.findOne({_id:couponId,isActive:true});
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }
  if (role === userRole.admin) {
    await coupon.updateOne({ isActive: false,DeactivatedBy: userId })
    return res.status(200).json({ message: "Coupon deactivated successfully by admin" });
  }

  if (role === userRole.vendor) {
    if (coupon.createdBy.toString() === userId.toString()) {
      await coupon.updateOne({ isActive: false ,DeactivatedBy: userId })
      return res.status(200).json({ message: "Coupon deactivated successfully by vendor" });
    }
    else {
      return res.status(403).json({ message: "You are not authorized to de-activate this coupon" })
    
    }
}
return res.status(403).json({ message: "You are not authorized to perform this action" })
})

export const reactivateCoupon = asynchandler(async (req, res, next) => {
  const { couponId } = req.params;
  const { role, _id: userId } = req.user;

  const coupon = await couponmodel.findById(couponId);
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }

 
  if (coupon.DeactivatedBy && coupon.DeactivatedBy !== userId) {
    return res.status(403).json({ message: `This coupon was deactivated by a ${coupon.DeactivatedBy}, only they can reactivate it.` });
  }

 
  if (role === userRole.vendor && coupon.createdBy.toString() !== userId.toString()) {
    return res.status(403).json({ message: "You are not authorized to reactivate this coupon" });
  }

  await coupon.updateOne({ isActive: true, DeactivatedBy: null });

  return res.status(200).json({ message: "Coupon reactivated successfully" });
});
