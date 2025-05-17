import cartmodel from "../../DB/models/cart.model.js";
import productmodel from "../../DB/models/product.model.js";
import { productStatus } from "../../middleware/ENum.js";
import { asynchandler } from "../../utils/globalErrorHandling/index.js";

export const addToCart = asynchandler(async (req, res) => {
    const userId = req.user._id;
    let { productId, quantity = 1 } = req.body;

    quantity = parseInt(quantity);
  
  
    const product = await productmodel.findOne({
      _id: productId,
      status: productStatus.approved,
      isDeleted: false
    });
  
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
  
   
    if (quantity > product.quantity) {
      return res.status(400).json({
        message: `Not enough stock. Available quantity: ${product.quantity}`
      });
    }
  
  
    let cart = await cartmodel.findOne({ user: userId });
  
    if (!cart) {
      
      cart = await cartmodel.create({
        user: userId,
        items: [{ product: productId, quantity, price: product.subPrice }]
      });
    } else {
  
      const existingItem = cart.items.find(item => item.product.toString() === productId);
  
      if (existingItem) {
        
        if (existingItem.quantity + quantity > product.quantity) {
          return res.status(400).json({
            message: `Not enough stock. Available quantity: ${product.quantity}`
          });
        }
  
     
        existingItem.quantity += quantity;
      } else {
       
        cart.items.push({ product: productId, quantity , price: product.subPrice});
      }
    }
  
  
    await cart.populate('items.product');
  
    cart.totalPrice = cart.items.reduce((total, item) => {
      return total + item.product.subPrice * item.quantity;
    }, 0);
  
    await cart.save();
  
    return res.status(200).json({
      message: 'Product added to cart successfully',
      data: cart
    });
});



export const removeItem = asynchandler(async (req, res) => {
  const { productId } = req.params;
  const quantity = req.body?.quantity ? parseInt(req.body.quantity) : 1; 
  const userId = req.user._id;

  const cart = await cartmodel.findOne({ user: userId });
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  const existingItem = cart.items.find(item => item.product.toString() === productId);
  if (!existingItem) {
    return res.status(404).json({ message: "Item not found in cart" });
  }


  if (quantity >= existingItem.quantity) {
    cart.items.pull(existingItem._id);
  } else {
    existingItem.quantity -= quantity;
  }
  await cart.populate('items.product');
  
  cart.totalPrice = cart.items.reduce((total, item) => {
    return total + item.product.subPrice * item.quantity;
  }, 0);



  await cart.save();

  return res.status(200).json({
    message: "Item quantity updated successfully",
    data: cart
  });
});


export const getCart = asynchandler(async (req, res) => {
const userId = req.user._id;
 
const cart = await cartmodel.findOne({ user: userId })
    .populate({
      path: 'items.product',
      select: 'image name description rateNum rateAvg'
});

if (!cart) {
    return res.status(404).json({ message: "Cart not found" })
}

  return res.status(200).json({
    message: "Cart retrieved successfully",
    data: cart})

})

export const clearCart = asynchandler(async (req, res) => {
    const userId = req.user._id;
  
    const cart = await cartmodel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
  
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
  
    return res.status(200).json({
      message: "Cart cleared successfully",
      data: cart
    });
  });


  export const getCartItemCount = asynchandler(async (req, res) => {
    const userId = req.user._id;
  
    const cart = await cartmodel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
  
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  
    return res.status(200).json({
      message: "Cart item count retrieved successfully",
      count: totalItems
    });
  });
  