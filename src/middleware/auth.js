import usermodel from "../DB/models/user.model.js";
import { asynchandler } from "../utils/globalErrorHandling/index.js";
import { verifytoken } from "../utils/token/verifyToken.js";
import { tokenTypes } from "./ENum.js";




export const decodedToken =async ({authorization,tokenType,next}) => {
  if (!authorization) {
    return next(new Error("Authorization header is missing", { cause: 401 }));
}

    const [prefix, token] = authorization.split(" ") ;
  
    if (!token || !prefix) {
      return next(new Error("Invalid token", { cause: 401 }));
    }
  
    let ACCESS_SIGNATURE = undefined;
    let REFRESH_SIGNATURE = undefined;
  
    if (prefix == process.env.PREFIX_TOKEN_USER || process.env.PREFIX_TOKEN_VENDOR) {
      ACCESS_SIGNATURE = process.env.ACCESS_SIGNATURE_USER;
      REFRESH_SIGNATURE = process.env.REFRESH_SIGNATURE_USER;
    } else if (prefix == process.env.PREFIX_TOKEN_ADMIN) {
      ACCESS_SIGNATURE = process.env.ACCESS_SIGNATURE_ADMIN;
      REFRESH_SIGNATURE = process.env.REFRESH_SIGNATURE_ADMIN;
      
    } else {
      return next(new Error("Invalid token prefix", { cause: 401 }));
    }
  
    const decoded = await verifytoken({
      token,
      SIGNATURE: tokenType===tokenTypes.access?ACCESS_SIGNATURE:REFRESH_SIGNATURE
    });
    if (!decoded?.id) {
      return next(new Error("Invalid token pay load", { cause: 403 }));
    }
  
    const user = await usermodel.findById(decoded.id)
     
    if (!user) {
      return next(new Error("User not found", { cause: 404 }));
    }
  
    if (user?.isdeleted) { 
      return next(new Error("user is deleted", { cause: 403 }));
  
    }
    if (user.changeCredentialsTime && decoded.iat * 1000 < new Date(user.changeCredentialsTime).getTime()) {
      return next(new Error("Token expired, please login again", { cause: 401 }));
  }
 
    return user
  }
  
  export const authenticate = asynchandler(async (req, res, next) => {
    const { authorization } = req.headers;
   
    const user=await decodedToken({ authorization,tokenType:tokenTypes.access,next})
  
   
    req.user = user;
    next();
  });
  
  export const authorization = (accessrole = []) => {
    return asynchandler(async (req, res, next) => {
      if (!accessrole.includes(req.user.role)) {
        return next(new Error("access denied", { cause: 403 }));
      }
  
      next();
    });
  };
  
  
