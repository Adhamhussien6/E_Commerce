import { AppError } from "../utils/globalErrorHandling/index.js";
import { asynchandler } from "../utils/globalErrorHandling/index.js";



export const validation = (schema) => {
    return asynchandler(async(req, res, next) => {
      const inputdata = { ...req.body, ...req.query, ...req.params,...(req.file && { file: req.file }),
      ...(req.files && { files: req.files }) }
     
      const result = schema.validate(inputdata, { abortEarly: true })
      
      if (result?.error) {
       
        return next(new AppError(result,{cause:400}))
      }

        next();
      
    });
  };
  


