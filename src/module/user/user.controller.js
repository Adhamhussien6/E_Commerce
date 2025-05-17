import { Router } from "express";
import { filetypes, multerHost } from "../../middleware/multer.js";
import { ApproveVendor, banUser, changePassword, changeToAdmin, confirmEmail, deleteProfilePic, deleteUser, forgotPassword, getAllBanneddUsers, getAllDeletedUsers, getAllUsers, getAllVendors, getAllVendorsrequests, getProfile, getUserData, login, resetPassword, searchStoreByName, signUp, unbanUser, updateProfile, updateProfilePicture } from "./user.service.js";
import { validation } from "../../middleware/validation.js";
import { changePasswordSchema, changeToAdminSchema, confirmEmailSchema, deletePictureSchema, forgotPasswordSchema, getLoginInfoSchema, loginSchema, resetPasswordSchema, signUpSchema, softDeleteSchema, updateProfilePictureSchema, updateProfileSchema } from "./user.validation.js";
import { authenticate, authorization } from "../../middleware/auth.js";
import { userRole } from "../../middleware/ENum.js";
import { checkBanStatus } from "../../middleware/checkBanStatus.js";

const userRouter = Router();

userRouter.post("/signUp",multerHost(filetypes.image).single("profilePicture"),validation(signUpSchema), signUp)
userRouter.patch("/confirmEmail",validation(confirmEmailSchema),confirmEmail)
userRouter.post("/logIn",validation(loginSchema),login)
userRouter.patch("/forgotPassword",validation(forgotPasswordSchema),authenticate,forgotPassword)
userRouter.patch("/resetPassword",validation(resetPasswordSchema),authenticate,resetPassword)
userRouter.get("/getProfile",validation(getLoginInfoSchema),authenticate,checkBanStatus,getProfile)
userRouter.patch("/changePassword",validation(changePasswordSchema),authenticate,changePassword)
userRouter.patch("/updateProfile", validation(updateProfileSchema), authenticate,checkBanStatus, updateProfile)
userRouter.patch("/updateProfilePicture", validation(updateProfilePictureSchema), authenticate,checkBanStatus,multerHost(filetypes.image).single("profilePicture"), updateProfilePicture)
userRouter.delete("/deleteProfilepic",validation(deletePictureSchema),authenticate,checkBanStatus,deleteProfilePic)
userRouter.delete("/hardDelete/:userId", validation(softDeleteSchema), authenticate,authorization(userRole.admin), deleteUser)
userRouter.patch("/banUser/:userId", validation(softDeleteSchema), authenticate,authorization(userRole.admin), banUser)
userRouter.patch("/unbanUser/:userId", validation(softDeleteSchema), authenticate,authorization(userRole.admin), unbanUser)
userRouter.get("/getUserData/:userId", validation(softDeleteSchema), authenticate,checkBanStatus, getUserData)
userRouter.patch("/aproveVendor/:userId", validation(softDeleteSchema), authenticate,authorization(userRole.admin), ApproveVendor)
userRouter.patch("/changeToAdmin/:userId",validation(changeToAdminSchema),authenticate,authorization(userRole.admin),changeToAdmin)
userRouter.get("/getAllUsers",authenticate,authorization(userRole.admin),getAllUsers)
userRouter.get("/getAllDeletedUsers",authenticate,authorization(userRole.admin),getAllDeletedUsers)
userRouter.get("/getAllVendorsrequests",authenticate,authorization(userRole.admin),getAllVendorsrequests)
userRouter.get("/getAllVendors",authenticate,authorization(userRole.admin),getAllVendors)
userRouter.get("/searchStoreByName",authenticate,authorization([userRole.admin,userRole.vendor,userRole.user]),searchStoreByName)












export default userRouter