import { Router } from "express";
import { authenticate, authorization } from "../../middleware/auth.js";
import { userRole } from "../../middleware/ENum.js";
import { addBrand, addBrandLogo, deleteBrand, deleteBrandLogo, exportBrands, exportBrandsPDF, getAllBrand, getAllDeletedBrands, getBrandById, getbrandCount, restoreBrand, restoreManybrand, softDeleteBrand, softDeleteManybrand, updateBrand } from "./brand.service.js";
import { validation } from "../../middleware/validation.js";
import { addbrandlogoschema, addBrandSchema, getAllBrandSchema, getBrandByIdSchema, softdeletebrandschema, softDeleteManyBrandSchema, updateBrandSchema } from "./brand.validation.js";
import { filetypes, multerHost } from "../../middleware/multer.js";

const brandRouter = Router();

brandRouter.post("/addBrand",multerHost(filetypes.image).single("logo"),validation(addBrandSchema),authenticate,authorization(userRole.admin),addBrand)
brandRouter.get("/getBrandById/:brandId",validation(getBrandByIdSchema),authenticate,getBrandById)
brandRouter.patch("/updateBrand/:brandId",multerHost(filetypes.image).single("logo"),validation(updateBrandSchema),authenticate,authorization(userRole.admin),updateBrand)
brandRouter.patch("/softDeleteBrand/:brandId",validation(softdeletebrandschema),authenticate,authorization(userRole.admin),softDeleteBrand)
brandRouter.patch("/restoreBrand/:brandId",validation(softdeletebrandschema),authenticate,authorization(userRole.admin),restoreBrand)
brandRouter.patch("/deleteBrandImage/:brandId",validation(softdeletebrandschema),authenticate,authorization(userRole.admin),deleteBrandLogo)
brandRouter.patch("/addBrandImage/:brandId",multerHost(filetypes.image).single("logo"),validation(addbrandlogoschema),authenticate,authorization(userRole.admin),addBrandLogo)
brandRouter.delete("/deleteBrand/:brandId",validation(softdeletebrandschema),authenticate,authorization(userRole.admin),deleteBrand)
brandRouter.get("/getAllBrands",validation(getAllBrandSchema),authenticate,getAllBrand)
brandRouter.get("/getAllDeletedBrands",validation(getAllBrandSchema),authenticate,authorization(userRole.admin),getAllDeletedBrands)
brandRouter.get("/getbrandCount", authenticate,authorization(userRole.user), getbrandCount)
brandRouter.patch("/softDeleteManyBrands",validation(softDeleteManyBrandSchema),authenticate,authorization(userRole.admin),softDeleteManybrand)
brandRouter.patch("/restoreManyBrands",validation(softDeleteManyBrandSchema),authenticate,authorization(userRole.admin),restoreManybrand)
brandRouter.get("/exportBrands",exportBrands);
brandRouter.get("/exportBrandspdf",exportBrandsPDF);








export default brandRouter;