import { Router } from "express";
import { authenticate, authorization } from "../../middleware/auth.js";
import { userRole } from "../../middleware/ENum.js";
import { validation } from "../../middleware/validation.js";
import { cancelOrder, createOrder, paymentWithStripe, success, webHookService } from "./order.service.js";


const orderRouter = Router();


orderRouter.post("/createOrder",authenticate,authorization(userRole.user),createOrder)
orderRouter.post("/create_payment",authenticate,authorization(userRole.user),paymentWithStripe)
orderRouter.post("/webhook",webHookService)
orderRouter.get("/success",success)

orderRouter.patch("/cancelOrder",authenticate,authorization(userRole.user),cancelOrder)






export default orderRouter;