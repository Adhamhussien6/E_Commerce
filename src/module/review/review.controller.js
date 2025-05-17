import { Router } from "express";
import { authenticate, authorization } from "../../middleware/auth.js";
import { userRole } from "../../middleware/ENum.js";
import { addReview, deleteComment,  getReviewsForProduct,  updateComment, updateRate } from "./review.service.js";

const reviewRouter = Router();

reviewRouter.post("/addReview/:productId",authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),addReview)
reviewRouter.patch("/updateComment/:productId/:reviewId",authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),updateComment)
reviewRouter.patch("/updateRate/:productId/:reviewId",authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),updateRate)
reviewRouter.patch("/deleteComment/:reviewId",authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),deleteComment)
reviewRouter.get("/getReviewsForProduct/:productId",authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),getReviewsForProduct)


export default reviewRouter;