import joi from "joi"
import {Types} from "mongoose"


 const customeid = (value, helper) => {
    const checkid = Types.ObjectId.isValid(value)
    return checkid ? value :helper.message(`id isn't a valid ${value}`)
}

export const genralrules = {
    email: joi.string().email({ tlds: { allow: true }, minDomainSegments: 2, maxDomainSegments: 3 }),
    password:joi.string(),
    id: joi.string().custom(customeid),
    headers: joi.object({
        authorization: joi.string().required(),
        // 'cache-control': joi.string(),
        // 'postman-token': joi.string(),
        // 'content-type': joi.string(),
        // 'content-length': joi.string(),
        // host: joi.string(),
        // 'user-agent': joi.string(),
        // accept: joi.string(),
        // 'accept-encoding': joi.string(),
        // connection: joi.string()
    }).unknown(true),

     file: joi.object({
                 size: joi.number().positive().required(),
                 mimetype: joi.string().required(),
                 encoding: joi.string().required(),
                 filename: joi.string().required(),
                 path: joi.string().required(),
            
                 originalname: joi.string().required(),
                 fieldname:joi.string().required()
            })
  
}