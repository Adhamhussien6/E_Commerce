import usermodel from "../DB/models/user.model.js";
import { asynchandler } from "../utils/globalErrorHandling/index.js";

export const checkBanStatus = asynchandler(async (req, res, next) => {
    const user = req.user; // خلي بالك لازم تكون عملت تحقق JWT قبله

    if (user.isbanned && user.bannedUntil) {
        const now = new Date();
        if (now >= user.bannedUntil) {
            
            await usermodel.findByIdAndUpdate(user._id, {
                isbanned: false,
                bannedAt: null,
                bannedUntil: null,
                bannedBy: null,
                
            });
            user.isbanned = false;
        } else {
            return res.status(403).json({
                message: `You are banned until ${user.bannedUntil.toISOString()}`,
            });
        }
    }

    next();
});
