import Stripe from "stripe";
import cartmodel from "../../DB/models/cart.model.js";
import ordermodel from "../../DB/models/order.model.js";
import { orderStatus, paymentMethodType } from "../../middleware/ENum.js";
import { asynchandler } from "../../utils/globalErrorHandling/index.js";
import { stripe } from "../../utils/stripe/stripe.js";
import { createCheckoutSession, refund } from "./payment/payment.js";




export const createOrder=asynchandler(async(req,res,next)=>{
   const {phone,address,paymentMethod}=req.body
   const cart=await cartmodel.findOne({user:req.user._id})
   if(!cart || cart.items.length===0 ){
      return res.status(400).json({message:"Cart is empty"})
   }
   const order=await ordermodel.create({
      userId:req.user._id,
      cartId:cart._id,
      phone,
      address,
      paymentMethod,
      status:paymentMethod == paymentMethodType.cash ? orderStatus.placed : orderStatus.pending,
      totalPrice:cart.totalPrice,
      items:cart.items
      
      
   })
  if (paymentMethod === paymentMethodType.cash) {
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
  }
   return res.status(201).json({message:"Order created",order})
 
})

export const paymentWithStripe = asynchandler(async (req, res, next) => {
  const { orderId } = req.body;

  const order = await ordermodel.findOne({
    userId: req.user._id,
    _id: orderId,
    status: orderStatus.pending
  }).populate({
    path: "cartId",
    populate: {
      path: "items.product"
    }
  });

  if (!order) {
    return res.status(400).json({ message: "Order not found" });
  }

  const session = await createCheckoutSession({
    customer_email: req.user.email,
    success_url:'http://localhost:3000/order/success',
    cancel_url:'https://localhost:3000/order/cancel',
    metadata: { orderId: order._id.toString() },
    line_items: order.cartId["items"].map((item) => ({
      price_data: {
        currency: "egp",
        product_data: {
          name: item.product.name,
          images: item.product.images?.length ? [item.product.images[0].secure_url] : [],
          description: item.product.description,
        },
        unit_amount: Math.round(item.product.price * 100),
      },
      quantity: item.quantity,
    })),
  
  });

  return res.status(200).json({ url:session.url })
});



export const webHookService = asynchandler(async (req, res, next) => {
  

  //console.log(req.body.data.object);
  const orderId = req.body.data.object.metadata.orderId;
  const order=await ordermodel.findOneAndUpdate({_id:orderId},{
    status:orderStatus.paid,
    paidAt:new Date(),
    paymentIntentId:req.body.data.object.payment_intent,
    
  
  })
  return {order}

 
  
 


});

export const success=asynchandler(async(req,res,next)=>{
return res.status(201).json({ message: "done" });
  })







export const cancelOrder = asynchandler(async (req, res, next) => {
  const { orderId } = req.body;

  const order = await ordermodel.findOneAndUpdate({ _id: orderId,status:{$in:[orderStatus.pending,orderStatus.paid,orderStatus.placed]},userId: req.user._id},{ cancelledAt: new Date(),cancelledBy: req.user._id });

  if (!order) {
    return res.status(404).json({ message: "Order not found" }); 
  }

  if (order.paymentMethod ==paymentMethodType.card ) {
    await refund({payment_intent:order.paymentIntentId, reason:"requested_by_customer" })
    await ordermodel.findOneAndUpdate({_id:order._id},{
      status:orderStatus.cancelled,
      cancelledAt:new Date(),
      cancelledBy:req.user._id,
      refundedAt:new Date(),
      
    })
  }



  res.status(200).json({ message: "Order cancelled successfully", order });
});


  