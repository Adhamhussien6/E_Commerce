import { Router } from "express";
import { authenticate, authorization } from "../../middleware/auth.js";
import { filetypes, multerHost } from "../../middleware/multer.js";
import { validation } from "../../middleware/validation.js";
import { userRole } from "../../middleware/ENum.js";
import { addSubCategory, addSubCategoryImage, deleteAllSubCategories, deleteSubCategory, deleteSubCategoryImage, duplicateSubCategory, getAllDeletedItems, getAllSubCategories, getSubCategoryById, getSubCategoryCount, restoreManySubCategory, restoreSubCategory, searchSubCategory, softDeleteManySubCategory, softDeleteSubCategory, suggestSubCategoryNames, updateSubCategory} from "./subcategory.service.js";
import { addSubCategoryImageSchema, addSubCategorySchema, getAllSubCategorySchema, searchSubCategorySchema, softDeleteManySubCategorySchema, softDeleteSubCategorySchema, updateSubCategorySchema } from "./subcategory.validation.js";


const subcategoryRouter = Router();

subcategoryRouter.post("/addSubcategory", multerHost(filetypes.image).single("image"), validation(addSubCategorySchema), authenticate, authorization(userRole.admin), addSubCategory);
subcategoryRouter.patch("/updateSubCategory/:id", multerHost(filetypes.image).single("image"), validation(updateSubCategorySchema), authenticate, authorization(userRole.admin), updateSubCategory);
subcategoryRouter.get("/getAllsubCategory", validation(getAllSubCategorySchema),authenticate, getAllSubCategories);
subcategoryRouter.patch("/softDeleteSubCategory/:id",validation(softDeleteSubCategorySchema), authenticate, authorization(userRole.admin), softDeleteSubCategory);
subcategoryRouter.patch("/restoreSubCategory/:id",validation(softDeleteSubCategorySchema), authenticate, authorization(userRole.admin), restoreSubCategory);
subcategoryRouter.delete("/deleteSubCategory/:id",validation(softDeleteSubCategorySchema), authenticate, authorization(userRole.admin), deleteSubCategory);
subcategoryRouter.get("/getSubCategoryById/:id",validation(softDeleteSubCategorySchema),authenticate,getSubCategoryById)
subcategoryRouter.patch("/deleteSubCategoryImage/:id",validation(softDeleteSubCategorySchema),authenticate,authorization(userRole.admin),deleteSubCategoryImage)
subcategoryRouter.patch("/deleteSubCategoryImage/:id",validation(softDeleteSubCategorySchema),authenticate,authorization(userRole.admin),deleteSubCategoryImage)
subcategoryRouter.patch("/addSubCategoryImage/:id",multerHost(filetypes.image).single("image"),validation(addSubCategoryImageSchema),authenticate,authorization(userRole.admin),addSubCategoryImage)
subcategoryRouter.get("/getSubCategoryCount", authenticate,authorization(userRole.admin), getSubCategoryCount)
subcategoryRouter.get("/searchSubCategory",validation(searchSubCategorySchema), authenticate, searchSubCategory)
subcategoryRouter.delete("/deleteAllSubCategories",authenticate,authorization(userRole.admin), deleteAllSubCategories)
subcategoryRouter.patch("/softDeleteMany",validation(softDeleteManySubCategorySchema),authenticate,authorization(userRole.admin),softDeleteManySubCategory)
subcategoryRouter.patch("/restoreMany",validation(softDeleteManySubCategorySchema),authenticate,authorization(userRole.admin),restoreManySubCategory)
subcategoryRouter.post("/duplicateSubCategory/:id", authenticate, authorization(userRole.admin), duplicateSubCategory);
subcategoryRouter.get("/ai/suggest", authenticate, authorization(userRole.admin), suggestSubCategoryNames);
subcategoryRouter.get('/trash', authenticate, authorization(userRole.admin), getAllDeletedItems);












export default subcategoryRouter;  