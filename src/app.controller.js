import connectionDB from "./DB/dbConnection.js";
import brandRouter from "./module/brand/brand.controller.js";
import cartRouter from "./module/cart/cart.controller.js";
import categoryRouter from "./module/category/category.controller.js";
import couponRouter from "./module/coupon/coupon.controller.js";
import orderRouter from "./module/order/order.controller.js";
import productRouter from "./module/product/product.controller.js";
import reviewRouter from "./module/review/review.controller.js";
import subcategoryRouter from "./module/subcategory/subcategory.controller.js";
import userRouter from "./module/user/user.controller.js";
import wishlistRouter from "./module/wishlist/wishlist.controller.js";

import { globalerrorhandling } from "./utils/globalErrorHandling/index.js";
//import { AppError, globalerrorhandling } from "./utils/globalErrorHandling/index.js";


const bootstrap=async(app,express)=>{


    app.use(express.json());


    await connectionDB()


    app.use("/user",userRouter)
    app.use("/category",categoryRouter)
    app.use("/subcategory",subcategoryRouter)
    app.use("/brand",brandRouter)
    app.use("/product",productRouter)
    app.use("/coupon",couponRouter)
    app.use("/wishlist",wishlistRouter)
    app.use("/cart",cartRouter)
    app.use("/review",reviewRouter)
    app.use("/order",orderRouter)



    app.get("/", (req, res, next) => {
        return res.status(200).json({ message: "Server is running" });
    });

    // app.use("*", (req, res, next) => {
     
    //      return next(new AppError(`invalid url ${req.originalUrl}`,404))
    //     // return res.status(200).json({ message: "Server is running" });
        
    //   });
       app.use(globalerrorhandling);
    
}


export default bootstrap