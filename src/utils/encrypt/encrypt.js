import CryptoJS from "crypto-js"


export const encrypt =async ({key,SECRET_KEY}) => {
    return CryptoJS.AES.encrypt(key, SECRET_KEY).toString()
}