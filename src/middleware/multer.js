import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary/index.js";

export const filetypes = {
    image: ["image/png", "image/jpg", "image/jpeg", "image/gif", "image/ico"],
    video: ["video/mp4", "video/quicktime", "video/mpeg"],
    audio: ["audio/mpeg", "audio/wav", "audio/aac"],
    document: ["application/pdf"],
};



export const multerHost = (customeValidation = []) => {
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: "ecommerce_express",
            allowed_formats: customeValidation.map(type => type.split("/")[1]),
        },
    });

    function fileFilter(req, file, cb) {
        if (customeValidation.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}`), false);
        }
    }

    const upload = multer({ storage, fileFilter });
    return upload;
};
