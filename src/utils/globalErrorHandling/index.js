
export class AppError extends Error { 
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.message = message
    }
  }

export const asynchandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(err => { 
          
           
            return next(err)
        })
    }
    
}


export const globalerrorhandling = (err, req, res, next) => { 
    if (process.env.MODE == 'DEV') {
     return   res.status(err.status || 500).json({
            message: err.message,
            stack: err.stack,
            error: err
        });
    }
   return res.status(err.status || 500).json({
        message: err.message,
       
    });
}