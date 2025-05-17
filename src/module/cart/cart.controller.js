import { Router } from "express";
import { authenticate, authorization } from "../../middleware/auth.js";
import { userRole } from "../../middleware/ENum.js";
import { addToCart, clearCart, getCart, getCartItemCount, removeItem } from "./cart.service.js";

const cartRouter = Router();

cartRouter.post("/addToCart",authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),addToCart)
cartRouter.patch("/removeItem/:productId",authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),removeItem)
cartRouter.get("/getCart",authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),getCart)
cartRouter.patch("/clearCart",authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),clearCart)
cartRouter.get("/getCartItemCount",authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),getCartItemCount)


export default cartRouter;