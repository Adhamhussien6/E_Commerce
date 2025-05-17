import productmodel from "../../DB/models/product.model.js";
import wishlistmodel from "../../DB/models/wishlist.model.js";
import { productStatus } from "../../middleware/ENum.js";
import { pagination } from "../../utils/feature/pagination.js";
import { asynchandler } from "../../utils/globalErrorHandling/index.js";

export const addProductToWishlist =asynchandler(async (req, res) => {
    const { productId, wishlistName } = req.body; 
    const userId = req.user._id;
  
    
    const product = await productmodel.findOne({_id:productId,status:productStatus.approved,isDeleted:false});
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
  
    
    const existingWishlists = await wishlistmodel.find({ user:userId });
  
    
    if (existingWishlists.length === 0) {
      const newWishlistName = wishlistName || "My Wishlist"; 
      
      const newWishlist = await wishlistmodel.create({
        user:userId,
        name: newWishlistName,
        products: [productId],
      });
  
      await newWishlist.save();
  
      return res.status(201).json({
        message: 'Product added to new wishlist successfully',
        data: newWishlist,
      });
    }
  
    
    if (wishlistName) {
    
      const existingWishlist = await wishlistmodel.findOne({ user:userId, name: wishlistName });
  
      if (existingWishlist) {

        if (existingWishlist.products.includes(productId)) {
            return res.status(400).json({ message: 'Product is already in the wishlist' });
          }
       
        existingWishlist.products.push(productId);
        await existingWishlist.save();
  
        return res.status(200).json({
          message: 'Product added to existing wishlist successfully',
          data: existingWishlist,
        });
      } else {
       
        const newWishlist =await wishlistmodel.create({
          user:userId,
          name: wishlistName,
          products: [productId],
        });
  
        await newWishlist.save();
  
        return res.status(201).json({
          message: 'Product added to new wishlist successfully',
          data: newWishlist,
        });
      }
    } else {

        const firstWishlist = existingWishlists[0];



        if (firstWishlist.products.includes(productId)) {
            return res.status(400).json({ message: 'Product is already in the wishlist' });
          }
    
    
    
      firstWishlist.products.push(productId);
      await firstWishlist.save();
  
      return res.status(200).json({
        message: 'Product added to default wishlist successfully',
        data: firstWishlist,
      });
    }
});

export const updateWishlistName=asynchandler(async(req,res)=>{
    const {oldName,newName}=req.body;
   const user=req.user._id;
    const wishlist=await wishlistmodel.findOne({user,name:oldName})
    if(!wishlist){
        return res.status(404).json({message:"wishlist not found"});
    }
    const existingWishlist = await wishlistmodel.findOne({ user, name: newName });
    if (existingWishlist) {
      return res.status(400).json({ message: "A wishlist with this name already exists" });
    }

    wishlist.name=newName;
    await wishlist.save();

    return res.status(200).json({message:"wishlist updated successfully",data:wishlist});
});

export const removeProductFromWishlist =asynchandler(async (req, res) => {
    const { productId, wishlistName } = req.body; 
    const user = req.user._id;
  
    
    const wishlist = await wishlistmodel.findOne({ user,name:wishlistName})
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' })
    }

    const productExists = wishlist.products.includes(productId);
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found in the wishlist' })
    }

    wishlist.products.pull(productId);
    await wishlist.save();
  
    return res.status(200).json({
      message: 'Product removed from wishlist successfully',
      data: wishlist
    });

   
})

export const deleteWishlist=asynchandler(async(req,res)=>{
    const {wishlistName}=req.params;
    const userId=req.user._id;
    const wishlist=await wishlistmodel.findOne({name:wishlistName,user:userId});
    if(!wishlist){
        return res.status(404).json({message:"Wishlist not found"});
    }
    await wishlist.deleteOne();
    return res.status(200).json({message:"Wishlist deleted successfully"});

})

export const createEmptyWishlist = asynchandler(async (req, res) => {
    const { name } = req.body;
    const userId = req.user._id;
    const wishlistName = name || "My Wishlist";
  
    const exists = await wishlistmodel.findOne({ user: userId, name: wishlistName });
    if (exists) return res.status(400).json({ message: "Wishlist already exists" });
  
    const newWishlist = await wishlistmodel.create({ user: userId, name: wishlistName });
    res.status(201).json({ message: "Wishlist created", data: newWishlist });
});

export const moveProductBetweenWishlists = asynchandler(async (req, res) => {
    const { productId, from, to } = req.body;
    const userId = req.user._id;
  
    const fromList = await wishlistmodel.findOne({ user: userId, name: from });
    const toList = await wishlistmodel.findOne({ user: userId, name: to });
  
    if (!fromList || !toList) return res.status(404).json({ message: "One or both wishlists not found" });
  
    const exists = fromList.products.includes(productId);
    if (!exists) return res.status(404).json({ message: "Product not found in source wishlist" });
  
    if (toList.products.includes(productId)) {
      return res.status(400).json({ message: "Product already exists in destination wishlist" });
    }
  
    fromList.products.pull(productId);
    toList.products.push(productId);
    await fromList.save();
    await toList.save();
  
    res.status(200).json({ message: "Product moved successfully" });
});
  
export const getMyWishlist = asynchandler(async (req, res) => {
    const userId = req.user._id;
    const { name, page, limit } = req.query;
    const filter = { user: userId };
    if (name) filter.name = name;
  
    const result = await pagination({
      model: wishlistmodel,
      filter,
      page,
      limit,
      populate: [{ path: 'products',model: productmodel, select: "name description price discount subPrice storeName rateAvg"}],
      sort: { createdAt: -1 }
    });
  
    res.status(200).json(result);
});
  
// export const setDefaultWishlist = asynchandler(async (req, res) => {
//     const userId = req.user._id;
//     const { wishlistName } = req.params;
  
//     const wishlists = await wishlistmodel.find({ user: userId });
  
//     let targetList = null;
//     for (const list of wishlists) {
//       if (list.name === wishlistName) {
//         targetList = list;
//         list.isDefault = true;
//       } else {
//         list.isDefault = false;
//       }
//       await list.save();
//     }
  
//     if (!targetList) return res.status(404).json({ message: "Wishlist not found" });
  
//     res.status(200).json({ message: "Default wishlist set successfully", data: targetList });
// });



 