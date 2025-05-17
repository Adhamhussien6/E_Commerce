import { Router } from "express";
import { authenticate, authorization } from "../../middleware/auth.js";
import { userRole } from "../../middleware/ENum.js";
import { addProduct, approveProduct, approveProductUpdate, deleteProduct, getAllDeletedProducts, getAllPendingUpdates, getAllProductForVendor, getAllProducts, getAllProductsRequests, getAllRejectedProducts, getMyProducts, getProductById, rejectProduct, rejectProductUpdate, restoreProduct, softdeleteProduct, updateProduct } from "./product.service.js";
import { filetypes, multerHost } from "../../middleware/multer.js";
import { validation } from "../../middleware/validation.js";
import { addproductSchema, approveProductSchema, getAllPendingUpdatesSchema, getAllProductForVendorSchema, updateProductSchema } from "./product.validation.js";

const productRouter = Router();

productRouter.post("/addProduct", multerHost(filetypes.image).fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 5 }
]),validation(addproductSchema), authenticate, authorization([userRole.admin, userRole.vendor]), addProduct)
productRouter.patch("/approveProduct/:id",validation(approveProductSchema),authenticate,authorization(userRole.admin),approveProduct)
productRouter.patch("/rejectProduct/:id",validation(approveProductSchema),authenticate,authorization(userRole.admin), rejectProduct)
productRouter.patch("/softdeleteProduct/:id",validation(approveProductSchema),authenticate,authorization([userRole.admin,userRole.vendor]),softdeleteProduct)
productRouter.patch("/restoreProduct/:id",validation(approveProductSchema),authenticate,authorization([userRole.admin,userRole.vendor]),restoreProduct)
productRouter.delete("/deleteProduct/:id",validation(approveProductSchema),authenticate,authorization([userRole.admin,userRole.vendor]),deleteProduct)
productRouter.patch("/updateProduct/:id",validation(updateProductSchema),authenticate,authorization([userRole.admin,userRole.vendor]),updateProduct)
productRouter.patch("/approveUpdate/:id",validation(approveProductSchema),authenticate,authorization(userRole.admin),approveProductUpdate)
productRouter.patch("/rejectUpdate/:id",validation(approveProductSchema),authenticate,authorization(userRole.admin),rejectProductUpdate)
productRouter.get("/getpendingUpdates",validation(getAllPendingUpdatesSchema),authenticate,authorization(userRole.admin), getAllPendingUpdates)
productRouter.get("/getAllProductsRequests",validation(getAllPendingUpdatesSchema),authenticate,authorization(userRole.admin), getAllProductsRequests)
productRouter.get("/getAllRejectedProducts",validation(getAllPendingUpdatesSchema),authenticate,authorization(userRole.admin), getAllRejectedProducts)
productRouter.get("/getAllProducts",validation(getAllPendingUpdatesSchema),authenticate,authorization(userRole.admin), getAllProducts)
productRouter.get("/getAllDeletedProducts",validation(getAllPendingUpdatesSchema),authenticate,authorization(userRole.admin), getAllDeletedProducts)
productRouter.get("/getAllProductForVendor/:vendorId",validation(getAllProductForVendorSchema),authenticate,authorization(userRole.admin), getAllProductForVendor)
productRouter.get("/getMyProducts",authenticate,authorization(userRole.vendor), getMyProducts)
productRouter.get("/getProductById/:productId",authenticate,getProductById)





export default productRouter;