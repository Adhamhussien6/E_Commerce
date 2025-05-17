import jwt from "jsonwebtoken"

export const verifytoken =async ({token,SIGNATURE}) => {
    return  jwt.verify(token,SIGNATURE)
            
}
