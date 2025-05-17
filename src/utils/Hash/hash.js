import bcrypt from 'bcrypt';

export const Hash = async({key,SALT_ROUNDs= process.env.SALT_ROUND}) => {

    return  bcrypt.hashSync(key, +SALT_ROUNDs) 
}