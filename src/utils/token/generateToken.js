import jwt from "jsonwebtoken"

export const generatetoken =async ({payload,SIGNATURE,option={}}) => {
    return jwt.sign
                (payload,
                    SIGNATURE,
                    option
                )
            
}