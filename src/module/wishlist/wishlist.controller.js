import {Router} from 'express';
import { authenticate, authorization } from '../../middleware/auth.js';
import { userRole } from '../../middleware/ENum.js';
import { addProductToWishlist, createEmptyWishlist, deleteWishlist, getMyWishlist, moveProductBetweenWishlists, removeProductFromWishlist, updateWishlistName } from './wishlist.service.js';
import { validation } from '../../middleware/validation.js';
import { addProductToWishlistValidation, deleteWishlistSchema, emptyWishlistSchema, getMyWishlistSchema, moveProductSchema, removeProductSchema, updateWishlistNameSchema } from './wishlist.validation.js';

const wishlistRouter = Router();

wishlistRouter.post("/addToWishlist",validation(addProductToWishlistValidation),authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),addProductToWishlist)
wishlistRouter.patch("/updateWishlistName",validation(updateWishlistNameSchema),authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),updateWishlistName)
wishlistRouter.patch("/removeProduct",validation(removeProductSchema),authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),removeProductFromWishlist)
wishlistRouter.get("/getMyWishlist",validation(getMyWishlistSchema),authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),getMyWishlist)
wishlistRouter.delete("/deleteWishlist/:wishlistName",validation(deleteWishlistSchema),authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),deleteWishlist)
wishlistRouter.post("/createEmptyOne",validation(emptyWishlistSchema),authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),createEmptyWishlist)
wishlistRouter.patch("/moveProduct",validation(moveProductSchema),authenticate,authorization([userRole.admin,userRole.user,userRole.vendor]),moveProductBetweenWishlists)

export default wishlistRouter;