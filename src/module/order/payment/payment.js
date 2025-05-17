import { stripe } from "../../../utils/stripe/stripe.js";



// export const createCheckoutSession = async (req, res) => {
 
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       mode: 'payment',
//       line_items,
//       success_url: 'https://localhost:3000/order/success',
//       cancel_url: 'https://localhost:3000/order/cancel',
//       metadata,
//       customer_email,
     
//     });

//     res.json({ url: session.url });
 
// };

export const createCheckoutSession = async ({ line_items, metadata, customer_email, success_url, cancel_url }) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items,
    success_url,
    cancel_url,
    metadata,
    customer_email,
  });
  return session;
};

export const refund = async ({ payment_intent, reason }) => {
  const refundation = await stripe.refunds.create({
    payment_intent,
    reason,
  });
  return refundation;
};
