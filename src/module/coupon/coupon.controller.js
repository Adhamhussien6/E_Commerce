import { Router } from "express";
import { authenticate, authorization } from "../../middleware/auth.js";
import { userRole } from "../../middleware/ENum.js";
import { addCoupon, deActivateCoupon, deleteCoupon, getAllCouponsForVendor, getCouponById, getCoupons, getMyCoupons, reactivateCoupon, updateCoupon } from "./coupon.service.js";
import { validation } from "../../middleware/validation.js";
import { addCouponSchema, deleteCouponSchema, getCouponByIdSchema, getCouponsForVendorSchema, getCouponsSchema, updateCouponSchema } from "./coupon.validation.js";

const couponRouter = Router();

couponRouter.post("/addCoupon",validation(addCouponSchema),authenticate,authorization([userRole.admin,userRole.vendor]),addCoupon)
couponRouter.get("/getCoupon",validation(getCouponsSchema),authenticate,authorization(userRole.admin),getCoupons)
couponRouter.get("/getAllCouponsForVendor/:vendorId",validation(getCouponsForVendorSchema),authenticate,authorization(userRole.admin),getAllCouponsForVendor)
couponRouter.get("/getMyCoupons",validation(addCouponSchema),authenticate,authorization([userRole.admin,userRole.vendor]),getMyCoupons)
couponRouter.get("/getCouponById/:id",validation(getCouponByIdSchema),authenticate,authorization(userRole.admin),getCouponById)
couponRouter.patch("/updatedCoupon/:id",validation(updateCouponSchema),authenticate,authorization([userRole.admin,userRole.vendor]),updateCoupon)
couponRouter.delete("/deleteCoupon/:couponId",validation(deleteCouponSchema),authenticate,authorization([userRole.admin,userRole.vendor]),deleteCoupon)
couponRouter.patch("/deActivateCoupon/:couponId",validation(deleteCouponSchema),authenticate,authorization([userRole.admin,userRole.vendor]),deActivateCoupon)
couponRouter.patch("/reactivateCoupon/:couponId",validation(deleteCouponSchema),authenticate,authorization([userRole.admin,userRole.vendor]),reactivateCoupon)




export default couponRouter;