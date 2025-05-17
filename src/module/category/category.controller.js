import { Router } from "express";
import { addCategory, deleteAllCategories, deleteCategory, deleteCategoryImage, getAllCategories, getAllDeletedCategories, getCategoryById, getCategoryCount, restoreCategory, searchCategory, softDeleteCategory, updateCategory } from "./category.service.js";
import { authenticate, authorization } from "../../middleware/auth.js";
import { userRole } from "../../middleware/ENum.js";
import { validation } from "../../middleware/validation.js";
import { addCategorySchema, getAllCategorySchema, getCategoryByIdSchema, searchCategorySchema, updateCategorySchema } from "./category.validation.js";
import { filetypes, multerHost } from "../../middleware/multer.js";

const categoryRouter = Router();


categoryRouter.post("/createCategory",multerHost(filetypes.image).single("image"),validation(addCategorySchema),authenticate,authorization(userRole.admin),addCategory)
categoryRouter.patch("/updateCategory/:categoryId",multerHost(filetypes.image).single("image"),validation(updateCategorySchema),authenticate,authorization(userRole.admin),updateCategory)
categoryRouter.get("/getAllCategory",validation(getAllCategorySchema),authenticate,getAllCategories)
categoryRouter.get("/getCategoryById/:id",validation(getCategoryByIdSchema),authenticate,getCategoryById)
categoryRouter.get("/searchCategoryByName",validation(searchCategorySchema),authenticate,searchCategory);



categoryRouter.patch("/softDeleteCategory/:id",authenticate,validation(getCategoryByIdSchema),authorization(userRole.admin),softDeleteCategory)
categoryRouter.patch("/restoreCategory/:id",authenticate,validation(getCategoryByIdSchema),authorization(userRole.admin),restoreCategory)
categoryRouter.delete("/deleteCategory/:id",authenticate,validation(getCategoryByIdSchema),authorization(userRole.admin),deleteCategory)
categoryRouter.patch("/deleteCategoryImage/:id",authenticate,validation(getCategoryByIdSchema),authorization(userRole.admin),deleteCategoryImage)
categoryRouter.delete("/deleteAllCategories",authenticate,authorization(userRole.admin),deleteAllCategories)
categoryRouter.get("/categoryStatistics", authenticate,authorization(userRole.admin), getCategoryCount);
categoryRouter.get("/getAllDeletedCategories", authenticate,authorization(userRole.admin), getAllDeletedCategories);




export default categoryRouter