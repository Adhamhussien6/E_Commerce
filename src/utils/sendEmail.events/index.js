import { EventEmitter } from "events";
import { sendEmail } from "../../service/sendEmail.js";
import { customAlphabet } from "nanoid";
import { html } from "./template_email.js";
import usermodel from "../../DB/models/user.model.js";
import { Hash } from "../Hash/hash.js";
//import { Hash } from "../hash/hash.js";








export const eventEmitter = new EventEmitter();

eventEmitter.on("confirmEmail", async (data) => {
  const { email, id } = data;
  // generate otp
  const otp = customAlphabet("012345679", 4)();
  const hashedOtp = await Hash({
    key: otp,
    SALT_ROUNDs: process.env.SALT_ROUND,
  });
  await usermodel.updateOne(
    { email, _id: id },
    {  $push: { 
      Otp: { 
        code: hashedOtp, 
        type: "confirmation", 
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) 
      } 
    } 
  } 
  );

  await sendEmail(
    email,
    "confirmation",
    html({ code: otp, message: "confirm email" })
  );
});


eventEmitter.on("forgotPassword", async (data) => {
  const { email } = data;
  // generate otp
  const otp = customAlphabet("012345679", 4)();
  const hashedOtp = await Hash({
    key: otp,
    SALT_ROUNDs: process.env.SALT_ROUND,
  });
  await usermodel.updateOne({ email },  {  $push: { 
    Otp: { 
      code: hashedOtp, 
      type: "forgotPassword", 
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) 
    } 
  } 
} );

  await sendEmail(
    email,
    "forgot password",
    html({ code: otp, message: "forget password" })
  );
});
